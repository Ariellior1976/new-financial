# Claude instructions

## Animation, video, editing and presentations

When a request involves animation, motion, video, media editing or presentations,
check the skills in `.claude/skills/` (and any enabled account skills/plugins)
and load the matching one **before** writing code or files:

| Request | Skill(s) |
|---|---|
| Web/UI animation, tweens, easing, sequencing | `gsap-core`, `gsap-timeline` |
| Scroll-driven animation, parallax, pinning | `gsap-scrolltrigger` |
| Animation in React / Next.js | `gsap-react` (and `rive-react` for Rive) |
| Animation in Vue / Svelte / Nuxt | `gsap-frameworks` |
| Flip, Draggable, SplitText, SVG drawing | `gsap-plugins` |
| Janky / slow animation | `gsap-performance` |
| Interactive buttons, animated characters, state machines | `rive-web`, `rive-react`, `rive-scripting`, `rive-generator` |
| Animate a logo (bounce, pulse, wiggle, loop) → Lottie / GIF / MP4 | `wiggle` |
| Vector animation from a prompt, screenshot or sketch (Lottie JSON) | `text-to-lottie` |
| 3D: character motion, glTF clips, morph targets, camera moves | `threejs-animation` |
| Programmatic video, kinetic typography, explainers, captions | Remotion plugin (if enabled) |
| Presentations / slide decks | the slides/pptx skill or deck artifact type; add GSAP for animated web slides |

Respect `prefers-reduced-motion` in all UI animation.
