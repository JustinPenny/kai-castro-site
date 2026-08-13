import grassLeftImg from './assets/grass_left.webp'
import grassRightImg from './assets/grass_right.webp'

// grass.webp is a seamlessly-tileable pixel-art strip (flush with itself
// edge-to-edge), so the fill between the caps is just a repeating CSS
// background instead of individually generated tick elements -- see
// Landing.css `.grass-fill`. `background-repeat` naturally tiles at the
// image's native pixel size, so it never squishes/stretches on resize:
// widening the window just reveals more repeats in the middle.
//
// grass_left/grass_right are grass.webp with its outermost blade trimmed
// off one side, so they read as a clean start/end to the strip instead of
// a blade getting cut off mid-tile at the edges.
export default function GrassStrip() {
  return (
    <div className="grass-strip" aria-hidden="true">
      <img className="grass-cap grass-cap-left" src={grassLeftImg} alt="" />
      <div className="grass-fill" />
      <img className="grass-cap grass-cap-right" src={grassRightImg} alt="" />
    </div>
  )
}
