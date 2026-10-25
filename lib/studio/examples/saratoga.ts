/**
 * Mood Fabrics' free Saratoga Cropped Cape Jacket, rebuilt in the studio through its own screens
 * (see blog.moodfabrics.com/saratoga-cropped-cape-jacket-sewing-pattern). Development only: loaded by
 * /studio/example/saratoga to have a full, ready pattern to look at. The photo is Mood's; not for publishing.
 */
import type { StudioPattern } from '../patterns'

export const SARATOGA: Omit<StudioPattern, 'id' | 'updatedAt'> = {
  "name": "Saratoga Cropped Cape Jacket",
  "category": "Outerwear",
  "difficulty": "Intermediate",
  "description": "A trench-inspired cropped cape with a poncho silhouette and no separate sleeves. Deep welt pockets, a button placket and a tiered storm capelet with a back slit and box pleat.",
  "estimatedTime": "6–8 hours",
  "price": 12,
  "sizes": [
    "XS",
    "S",
    "M",
    "L",
    "XL"
  ],
  "sizeChart": {
    "XS": {
      "bust": 80,
      "waist": 62,
      "hips": 87
    },
    "S": {
      "bust": 84,
      "waist": 66,
      "hips": 91
    },
    "M": {
      "bust": 88,
      "waist": 70,
      "hips": 95
    },
    "L": {
      "bust": 92,
      "waist": 76,
      "hips": 100
    },
    "XL": {
      "bust": 96,
      "waist": 82,
      "hips": 105
    }
  },
  "fabric": {
    "name": "Cotton herringbone twill",
    "why": "Medium weight: it holds the cape shape and presses crisp pleats. Canvas, denim or wool suiting also work.",
    "metersBySize": {
      "S": 2.75,
      "M": 2.9,
      "XS": 2.6,
      "L": 3,
      "XL": 3.2
    }
  },
  "notions": [
    "8 buttons, 20 mm",
    "Thread to match",
    "Fusible interfacing"
  ],
  "tools": [
    "scissors",
    "pins",
    "needle",
    "iron"
  ],
  "seamAllowance": 1.5,
  "pieces": [
    {
      "id": "piece-1",
      "label": "A",
      "name": "Body",
      "shape": "trapezoid",
      "onFold": true,
      "lines": [
        {
          "id": "top-1",
          "label": "Neck"
        },
        {
          "id": "lmvoaudni",
          "label": "Shoulder",
          "curveBelow": 4
        },
        {
          "id": "bottom-1",
          "label": "Hem"
        }
      ],
      "bySize": {
        "M": {
          "top-1": {
            "down": null,
            "width": 9
          },
          "lmvoaudni": {
            "down": 10,
            "width": 24
          },
          "bottom-1": {
            "down": 55,
            "width": 62
          }
        },
        "XS": {
          "top-1": {
            "down": 0,
            "width": 8
          },
          "lmvoaudni": {
            "down": 10,
            "width": 22
          },
          "bottom-1": {
            "down": 53.5,
            "width": 56.5
          }
        },
        "S": {
          "top-1": {
            "down": 0,
            "width": 8.5
          },
          "lmvoaudni": {
            "down": 10,
            "width": 23
          },
          "bottom-1": {
            "down": 54.5,
            "width": 59.5
          }
        },
        "L": {
          "top-1": {
            "down": 0,
            "width": 9.5
          },
          "lmvoaudni": {
            "down": 10,
            "width": 25
          },
          "bottom-1": {
            "down": 55.5,
            "width": 65
          }
        },
        "XL": {
          "top-1": {
            "down": 0,
            "width": 10
          },
          "lmvoaudni": {
            "down": 10,
            "width": 26.5
          },
          "bottom-1": {
            "down": 56.5,
            "width": 68
          }
        }
      },
      "dims": {
        "topWidth": 9,
        "bottomWidth": 62,
        "height": 55
      },
      "quantity": 1,
      "grainLine": "vertical",
      "seamAllowance": 1.5,
      "outline": {
        "lines": [
          {
            "down": 0,
            "width": 9,
            "curve": 0
          },
          {
            "down": 10,
            "width": 24,
            "curve": 4
          },
          {
            "down": 55,
            "width": 62,
            "curve": 0
          }
        ],
        "onFold": true,
        "necklineDepth": 0
      }
    },
    {
      "id": "piece-2",
      "label": "B",
      "name": "Overlay",
      "shape": "trapezoid",
      "onFold": false,
      "lines": [
        {
          "id": "top-2",
          "label": "Neck",
          "curveBelow": 3
        },
        {
          "id": "bottom-2",
          "label": "Hem"
        }
      ],
      "bySize": {
        "M": {
          "top-2": {
            "down": null,
            "width": 10
          },
          "bottom-2": {
            "down": 30,
            "width": 46
          }
        },
        "XS": {
          "top-2": {
            "down": 0,
            "width": 9
          },
          "bottom-2": {
            "down": 29.5,
            "width": 42
          }
        },
        "S": {
          "top-2": {
            "down": 0,
            "width": 9.5
          },
          "bottom-2": {
            "down": 29.5,
            "width": 44
          }
        },
        "L": {
          "top-2": {
            "down": 0,
            "width": 10.5
          },
          "bottom-2": {
            "down": 30.5,
            "width": 48.5
          }
        },
        "XL": {
          "top-2": {
            "down": 0,
            "width": 11
          },
          "bottom-2": {
            "down": 30.5,
            "width": 50.5
          }
        }
      },
      "dims": {
        "topWidth": 10,
        "bottomWidth": 46,
        "height": 30
      },
      "quantity": 2,
      "grainLine": "vertical",
      "seamAllowance": 1.5,
      "outline": {
        "lines": [
          {
            "down": 0,
            "width": 10,
            "curve": 3
          },
          {
            "down": 30,
            "width": 46,
            "curve": 0
          }
        ],
        "onFold": false,
        "necklineDepth": 0
      }
    },
    {
      "id": "piece-3",
      "label": "C",
      "name": "Collar",
      "shape": "trapezoid",
      "onFold": true,
      "lines": [
        {
          "id": "top-3",
          "label": "Outer edge"
        },
        {
          "id": "bottom-3",
          "label": "Neck edge"
        }
      ],
      "bySize": {
        "M": {
          "top-3": {
            "down": null,
            "width": 22
          },
          "bottom-3": {
            "down": 8,
            "width": 20
          }
        },
        "XS": {
          "top-3": {
            "down": 0,
            "width": 20
          },
          "bottom-3": {
            "down": 8,
            "width": 18.5
          }
        },
        "S": {
          "top-3": {
            "down": 0,
            "width": 21
          },
          "bottom-3": {
            "down": 8,
            "width": 19
          }
        },
        "L": {
          "top-3": {
            "down": 0,
            "width": 23
          },
          "bottom-3": {
            "down": 8,
            "width": 21
          }
        },
        "XL": {
          "top-3": {
            "down": 0,
            "width": 24
          },
          "bottom-3": {
            "down": 8,
            "width": 22
          }
        }
      },
      "dims": {
        "topWidth": 22,
        "bottomWidth": 20,
        "height": 8
      },
      "quantity": 2,
      "grainLine": "vertical",
      "seamAllowance": 1.5,
      "outline": {
        "lines": [
          {
            "down": 0,
            "width": 22,
            "curve": 0
          },
          {
            "down": 8,
            "width": 20,
            "curve": 0
          }
        ],
        "onFold": true,
        "necklineDepth": 0
      }
    },
    {
      "id": "piece-4",
      "label": "D",
      "name": "Welt",
      "shape": "rectangle",
      "onFold": false,
      "lines": [
        {
          "id": "top-4",
          "label": "Top"
        },
        {
          "id": "bottom-4",
          "label": "Bottom"
        }
      ],
      "bySize": {
        "M": {
          "top-4": {
            "down": null,
            "width": 18
          },
          "bottom-4": {
            "down": 6,
            "width": 18
          }
        },
        "XS": {
          "top-4": {
            "down": 0,
            "width": 16.5
          },
          "bottom-4": {
            "down": 6,
            "width": 16.5
          }
        },
        "S": {
          "top-4": {
            "down": 0,
            "width": 17
          },
          "bottom-4": {
            "down": 6,
            "width": 17
          }
        },
        "L": {
          "top-4": {
            "down": 0,
            "width": 19
          },
          "bottom-4": {
            "down": 6,
            "width": 19
          }
        },
        "XL": {
          "top-4": {
            "down": 0,
            "width": 20
          },
          "bottom-4": {
            "down": 6,
            "width": 20
          }
        }
      },
      "dims": {
        "topWidth": 18,
        "bottomWidth": 18,
        "height": 6
      },
      "quantity": 4,
      "grainLine": "vertical",
      "seamAllowance": 1.5,
      "outline": {
        "lines": [
          {
            "down": 0,
            "width": 18,
            "curve": 0
          },
          {
            "down": 6,
            "width": 18,
            "curve": 0
          }
        ],
        "onFold": false,
        "necklineDepth": 0
      }
    },
    {
      "id": "piece-5",
      "label": "E",
      "name": "Pocket bag",
      "shape": "rectangle",
      "onFold": false,
      "lines": [
        {
          "id": "top-5",
          "label": "Top",
          "curveBelow": 2
        },
        {
          "id": "bottom-5",
          "label": "Bottom"
        }
      ],
      "bySize": {
        "M": {
          "top-5": {
            "down": null,
            "width": 18
          },
          "bottom-5": {
            "down": 22,
            "width": 18
          }
        },
        "XS": {
          "top-5": {
            "down": 0,
            "width": 16.5
          },
          "bottom-5": {
            "down": 21.5,
            "width": 16.5
          }
        },
        "S": {
          "top-5": {
            "down": 0,
            "width": 17
          },
          "bottom-5": {
            "down": 21.5,
            "width": 17
          }
        },
        "L": {
          "top-5": {
            "down": 0,
            "width": 19
          },
          "bottom-5": {
            "down": 22.5,
            "width": 19
          }
        },
        "XL": {
          "top-5": {
            "down": 0,
            "width": 20
          },
          "bottom-5": {
            "down": 22.5,
            "width": 20
          }
        }
      },
      "dims": {
        "topWidth": 18,
        "bottomWidth": 18,
        "height": 22
      },
      "quantity": 4,
      "grainLine": "vertical",
      "seamAllowance": 1.5,
      "outline": {
        "lines": [
          {
            "down": 0,
            "width": 18,
            "curve": 2
          },
          {
            "down": 22,
            "width": 18,
            "curve": 0
          }
        ],
        "onFold": false,
        "necklineDepth": 0
      }
    }
  ],
  "steps": [
    {
      "id": 1,
      "group": "Pockets",
      "action": "prepare",
      "title": "Make the welts",
      "instruction": "Iron interfacing onto the welts. Fold each welt in half lengthwise and press. Mark the pocket openings on the body with chalk, pin a welt to each mark and sew. Cut the opening between the welts, with small triangles at the ends. Turn the welts inside and press.",
      "measurement": "1.3 cm seam",
      "tip": "Cut right up to the stitching at the corners, but not through it.",
      "pieceId": "piece-4"
    },
    {
      "id": 2,
      "group": "Pockets",
      "action": "sew",
      "title": "Sew the pocket bags",
      "instruction": "Sew each pocket bag to a welt seam allowance, not to the cape. Sew the two bags together, catch the little triangles in the side seams, then close the pocket all the way round.",
      "pieceId": "piece-5"
    },
    {
      "id": 3,
      "group": "Front placket",
      "action": "fold",
      "title": "Fold the button placket",
      "instruction": "Press 1.3 cm in along both centre front edges, then fold again for a clean double fold. Topstitch from the hem about three quarters of the way up. Leave the top open for now.",
      "measurement": "1.3 cm fold",
      "pieceId": "piece-1"
    },
    {
      "id": 4,
      "group": "Back",
      "action": "sew",
      "title": "Sew the box pleat",
      "instruction": "Fold the lower cape right sides together at the centre back and match the pleat notches. Sew a 5 cm seam. Open it, flatten it to the centre back seam, press, and baste across the top 6 mm from the edge.",
      "measurement": "5 cm seam",
      "pieceId": "piece-1"
    },
    {
      "id": 5,
      "group": "Back",
      "action": "sew",
      "title": "Sew the back slit",
      "instruction": "Sew the two overlay pieces right sides together from the neckline down to the slit. Press the seam open, fold the slit edges in and topstitch. Press a double 6 mm hem along the overlay fronts and sew it.",
      "measurement": "6 mm hem",
      "pieceId": "piece-2"
    },
    {
      "id": 6,
      "group": "Assemble",
      "action": "attach",
      "title": "Join the necklines",
      "instruction": "Lay the overlay, wrong side down, on the right side of the body. Line up the shoulders, pin the necklines together and sew.",
      "pieceId": "piece-2"
    },
    {
      "id": 7,
      "group": "Assemble",
      "action": "sew",
      "title": "Hem both layers",
      "instruction": "Press a 2.5 cm fold along both hems and sew 2 cm from the edge.",
      "measurement": "2.5 cm fold",
      "pieceId": "piece-1"
    },
    {
      "id": 8,
      "group": "Assemble",
      "action": "pin",
      "title": "Tack the pocket bags",
      "instruction": "Hand-sew a few small stitches at the pocket corners to hold the bags to the inside of the placket.",
      "pieceId": "piece-5"
    },
    {
      "id": 9,
      "group": "Assemble",
      "action": "sew",
      "title": "Finish the placket",
      "instruction": "Unfold the top of the placket and refold it right sides together. Sew across the top, turn it right side out and carry the topstitching up to the neckline.",
      "pieceId": "piece-1"
    },
    {
      "id": 10,
      "group": "Collar",
      "action": "sew",
      "title": "Sew the collar",
      "instruction": "Iron interfacing onto one collar piece. Sew the two pieces right sides together around the curved edge and the sides, leaving the neck edge open. Clip the corners, turn, push the corners out and press.",
      "pieceId": "piece-3"
    },
    {
      "id": 11,
      "group": "Collar",
      "action": "attach",
      "title": "Attach the collar",
      "instruction": "Pin the collar to the neckline with the interfaced side against the right side of the cape. Sew, press the seam allowance down and understitch it inside the cape.",
      "pieceId": "piece-3"
    },
    {
      "id": 12,
      "group": "Buttons",
      "action": "sew",
      "title": "Sew the buttons and buttonholes",
      "instruction": "Mark six button positions: the first 2 cm from the top, then every 9 cm. Check the overlay lies flat over the body. Sew the buttons by hand and the buttonholes with the buttonhole foot.",
      "measurement": "9 cm apart",
      "tip": "Try one buttonhole on a scrap first.",
      "pieceId": "piece-1"
    }
  ],
  "sectionIcons": {},
  "messages": [],
  "status": "ready",
  "photo": "https://blog.moodfabrics.com/wp-content/uploads/2026/10/Herringbone-Twill-Coutil-Fashion-Fabric-Saratoga-Cropped-Cape-Jacket-Model-Photo-H1-768x432.jpg"
}
