// grass.webp is a seamlessly-tileable pixel-art strip (flush with itself
// edge-to-edge), so the grass is just a repeating CSS background instead of
// individually generated tick elements -- see Landing.css `.grass-strip`.
// `background-repeat` naturally tiles at the image's native pixel size, so
// it never squishes/stretches on resize: widening the window just reveals
// more repeats.
export default function GrassStrip() {
  return <div className="grass-strip" aria-hidden="true" />
}
