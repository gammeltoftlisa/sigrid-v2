/**
 * Draws folding cloth with per-pixel light on a fine mesh. One WebGL context is shared by every
 * stage on the page (browsers allow only a few): each frame is rendered there and copied to the
 * stage's own canvas. Returns null where WebGL isn't available, and the scene falls back to SVG.
 */
const VS = `
attribute vec3 aPos; attribute vec3 aNor; attribute vec2 aUv; attribute float aLift;
uniform vec2 uScale; uniform vec2 uOffset; uniform vec2 uSize; uniform float uDepth; uniform vec2 uCenter; uniform float uLoom;
varying vec3 vN; varying vec2 vUv; varying float vLift;
void main() {
  // nearer the camera it looms a little
  vec2 xy = aPos.xy + (aPos.xy - uCenter) * aPos.z * uLoom;
  vec2 px = xy * uScale + uOffset;
  vec2 clip = px / uSize * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, -aPos.z * uDepth, 1.0);
  vN = aNor; vUv = aUv; vLift = aLift;
}`
const FS = `
precision highp float;
uniform sampler2D uFront; uniform sampler2D uBack; uniform float uAlpha;
varying vec3 vN; varying vec2 vUv; varying float vLift;
void main() {
  vec3 n = normalize(vN);
  bool front = n.z >= 0.0;
  vec4 c = front ? texture2D(uFront, vUv) : texture2D(uBack, vUv);
  if (c.a < 0.3) discard;
  if (!front) n = -n;
  vec3 L = normalize(vec3(-0.42, -0.6, 0.68));
  float flat0 = L.z;
  float light = dot(n, L) / flat0;
  // soft light: shade comes on gradually, a slope facing the light brightens a touch
  float k = clamp(0.68 + 0.32 * light, 0.58, 1.08);
  float dark = min(k, 1.0);
  float lit = max(k - 1.0, 0.0) * 1.5;
  vec3 rgb = c.rgb * dark + (c.a - c.rgb) * lit;
  float a = c.a * vLift * uAlpha;
  gl_FragColor = vec4(rgb * vLift * uAlpha, a);
}`

export interface ClothDraw {
  positions: Float32Array
  normals: Float32Array
  uvs: Float32Array
  lifts: Float32Array
  indices: Uint16Array
  front: WebGLTexture
  back: WebGLTexture
  scale: number
  offsetX: number
  offsetY: number
  center: [number, number]
  loom: number
  depth: number
  alpha: number
}

class ClothGL {
  canvas = document.createElement('canvas')
  gl: WebGLRenderingContext
  private buffers: Record<string, WebGLBuffer>
  private idx: WebGLBuffer
  private loc: Record<string, number>
  private uni: Record<string, WebGLUniformLocation | null>
  constructor(gl: WebGLRenderingContext, canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.gl = gl
    const shader = (type: number, src: string) => {
      const s = gl.createShader(type)!
      gl.shaderSource(s, src)
      gl.compileShader(s)
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader')
      return s
    }
    const prog = gl.createProgram()!
    gl.attachShader(prog, shader(gl.VERTEX_SHADER, VS))
    gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FS))
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('link')
    gl.useProgram(prog)
    this.loc = { aPos: gl.getAttribLocation(prog, 'aPos'), aNor: gl.getAttribLocation(prog, 'aNor'), aUv: gl.getAttribLocation(prog, 'aUv'), aLift: gl.getAttribLocation(prog, 'aLift') }
    this.uni = {}
    for (const u of ['uScale', 'uOffset', 'uSize', 'uDepth', 'uCenter', 'uLoom', 'uFront', 'uBack', 'uAlpha']) this.uni[u] = gl.getUniformLocation(prog, u)
    this.buffers = { aPos: gl.createBuffer()!, aNor: gl.createBuffer()!, aUv: gl.createBuffer()!, aLift: gl.createBuffer()! }
    this.idx = gl.createBuffer()!
    gl.uniform1i(this.uni.uFront, 0)
    gl.uniform1i(this.uni.uBack, 1)
    gl.enable(gl.DEPTH_TEST)
    gl.depthFunc(gl.LEQUAL)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
  }
  texture(source: HTMLCanvasElement) {
    const gl = this.gl
    const t = gl.createTexture()!
    gl.bindTexture(gl.TEXTURE_2D, t)
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    return t
  }
  deleteTexture(t: WebGLTexture) {
    this.gl.deleteTexture(t)
  }
  /** Renders into the shared canvas, in its top left W×H pixels, and copies that to `target` */
  render(draws: ClothDraw[], W: number, H: number, dpr: number, target: CanvasRenderingContext2D) {
    const gl = this.gl
    const pw = Math.ceil(W * dpr)
    const ph = Math.ceil(H * dpr)
    if (this.canvas.width < pw || this.canvas.height < ph) {
      this.canvas.width = Math.max(this.canvas.width, pw)
      this.canvas.height = Math.max(this.canvas.height, ph)
    }
    const y0 = this.canvas.height - ph
    gl.viewport(0, y0, pw, ph)
    gl.enable(gl.SCISSOR_TEST)
    gl.scissor(0, y0, pw, ph)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.uniform2f(this.uni.uSize, W, H)
    for (const d of draws) {
      gl.clear(gl.DEPTH_BUFFER_BIT)
      const attr = (name: string, data: Float32Array, size: number, usage: number) => {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers[name])
        gl.bufferData(gl.ARRAY_BUFFER, data, usage)
        gl.enableVertexAttribArray(this.loc[name])
        gl.vertexAttribPointer(this.loc[name], size, gl.FLOAT, false, 0, 0)
      }
      attr('aPos', d.positions, 3, gl.DYNAMIC_DRAW)
      attr('aNor', d.normals, 3, gl.DYNAMIC_DRAW)
      attr('aUv', d.uvs, 2, gl.STATIC_DRAW)
      attr('aLift', d.lifts, 1, gl.DYNAMIC_DRAW)
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.idx)
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, d.indices, gl.STATIC_DRAW)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, d.front)
      gl.activeTexture(gl.TEXTURE1)
      gl.bindTexture(gl.TEXTURE_2D, d.back)
      gl.uniform2f(this.uni.uScale, d.scale, d.scale)
      gl.uniform2f(this.uni.uOffset, d.offsetX, d.offsetY)
      gl.uniform2f(this.uni.uCenter, d.center[0], d.center[1])
      gl.uniform1f(this.uni.uLoom, d.loom)
      gl.uniform1f(this.uni.uDepth, d.depth)
      gl.uniform1f(this.uni.uAlpha, d.alpha)
      gl.drawElements(gl.TRIANGLES, d.indices.length, gl.UNSIGNED_SHORT, 0)
    }
    target.clearRect(0, 0, pw, ph)
    target.drawImage(this.canvas, 0, 0, pw, ph, 0, 0, pw, ph)
  }
}

let shared: ClothGL | null | undefined
export function clothGL() {
  if (shared !== undefined) return shared
  try {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 64
    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: true, depth: true, preserveDrawingBuffer: false })
    shared = gl ? new ClothGL(gl, canvas) : null
  } catch {
    shared = null
  }
  return shared
}
