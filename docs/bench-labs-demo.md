# Bench Labs website demo

The supplied `bench-labs-demo` contains the app's HTML/CSS/JavaScript, a browser
bridge and sample data for a Lenovo Legion 5i 16. The website serves a copy from
`public/bench-labs/app`. The original delivery remains untouched.

## What we use

| Page area | Replacement or addition | Benefit |
| --- | --- | --- |
| Hero | Real Início screen | Crisp text/SVG and changing simulated sensor readings. |
| Live monitor | Raio-X, Painel and Blocos, including left-side miniature previews | Visitors can explore all three layouts, without screenshot compression. |
| Bench Marks | Real selection screen, profiles and descriptions | Try test selection and see the actual interface. Execution stays in the Windows app. |
| Battery | Real battery screen with the missing configuration mocks supplied by the website adapter | Choose activities, modes and custom duration. No fabricated completed benchmark results. |
| Health | Removed from the landing page | Still present inside the supplied app demo. |
| Hardware | Removed from the landing page | Source screens remain available for future use. |
| Colors | Five actual app palettes | Switch Bench, Claro, Grafite, Meia-noite, and Pista. The app’s seasonal Abóbora palette is not offered outside October. |
| Bench Monitor | Standalone `bench-monitor.html`, at its supplied 1240 × 800 size | Live overlay preview, presets, themes, shortcuts and local sample game records; fonts/logo are served from `monitor-app/`. |
| Updates (new) | Real Atualizações screen | Explore Windows/driver/program update simulations and the new-notebook checklist. |

## What remains an image

The community FPS screen is **not included** in the delivery. The community section, its sample data, and screenshot helper are commented
out until the feature is released; local game records are not presented as community
statistics. The existing image is also retained for social previews (Open Graph).
The other old screenshot assets remain on disk for compatibility, but are no
longer rendered in their former page sections.

## Landing page navigation and help

`section-nav.tsx` provides sticky anchor links to the remaining sections with
scroll highlighting, mobile horizontal scrolling, and reduced-motion support.
Section headings use larger eyebrow labels. Health and hardware sections are
removed. Five FAQ disclosures follow the final download CTA, followed by a link
to the specific Discord benchmark channel supplied by the owner. Community FPS
remains commented out until release.

## Website adapter

- `demo-frame.tsx`: scales the desktop UI without rasterizing it, opens an
  unscaled dialog with scrolling, Escape dismissal and focus restoration, labels sample data, and mounts frames
  only near the viewport. Offscreen frames are removed to stop their timers.
  Leaving the viewport can therefore reset an individual demo's transient state.
- `site-demo.js`: adds the missing `bat_*` configuration APIs and isolated
  sensor, display and health layouts. The battery preview offers configuration,
  not an invented end-to-end measurement or report.
- `site-guard.js`: installs a capture handler before app handlers so execution
  controls immediately explain that tests require the Windows app.
- `marks/index.html`: also guards the execution entry point itself and omits
  WebGPU adapter probing. The standalone automatically running game/3D pages
  and mini window are not published.
- Reduced-motion preferences are honored in the embedded documents.
- Demo styles/scripts stay in iframe documents, outside the React application
  bundle and global stylesheet.

The original demo returns `{}` for unknown APIs. Native-only operations such as
exporting a report or opening a Windows application are not implemented by the
website. Provided update workflows are simulations in memory. No host hardware
readings or installations are performed.

## Updating the supplied UI

Copy new source files into `public/bench-labs/app`, preserving the website
adapter/guard scripts, their script tags, and the guarded execution entry point.
Keep the source archive outside `public`. Verify sample-data API shapes against
new versions before replacing the published copy. Do not restore standalone
pages that automatically start benchmark workloads.

## Further opportunities

Ask the app developer for a fixture-backed community FPS screen, populated
benchmark results/reports, and a complete battery demo lifecycle. These would
restore the community section with a live block and let visitors inspect real result layouts without
running benchmarks in their browser. A dedicated responsive embed mode would
also improve phone usability beyond the scaled preview and enlarged dialog.
