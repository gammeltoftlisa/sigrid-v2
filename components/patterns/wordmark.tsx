import { cn } from 'cn'

/** The needle bent into an S, traced from the brand photo and made a little heavier, so it holds up at small sizes. It takes the colour of the text around it. */
export function NeedleMark({ className }: { className?: string }) {
  return (
    <svg viewBox="286 244 438 540" aria-hidden className={cn('w-auto', className)} fill="currentColor">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="38"
        d="M550 290C505 288 472 293 449 309C424 326 411 355 411 388C411 428 427 461 464 483C492 500 532 514 567 537C600 560 622 596 622 640C622 682 605 716 565 732C530 745 470 748 415 754"
      />
      <path d="M420 734L296 761L420 773Z" />
      <path
        fillRule="evenodd"
        d="M525 274C560 260 620 254 688 255C704 255 713 270 713 286C713 302 704 316 688 317C620 320 560 316 525 306ZM576 287C588 275 620 271 650 272C670 273 682 279 682 287C682 295 670 301 650 301C620 303 588 299 576 287Z"
      />
    </svg>
  )
}

/** "Sigrid" with the needle as its S. Sized by the parent font size. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span role="img" aria-label="Sigrid" className={cn('wordmark', className)}>
      <NeedleMark className="wordmark-needle" />
      <span aria-hidden>igrid</span>
    </span>
  )
}

/** The rail's mark: the needle on its own. */
export function Logomark({ className }: { className?: string }) {
  return <NeedleMark className={cn('h-7', className)} />
}
