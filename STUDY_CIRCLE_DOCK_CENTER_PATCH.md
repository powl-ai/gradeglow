# Study Circle / Mobile Dock patch

- Mobile navigation is rendered through a React portal directly into `document.body` so transformed app wrappers cannot offset it.
- A full-width fixed shell centers the dock against the actual viewport.
- The Study Circle landing state now shows only the user's compact profile/code card above the comparison.
- Intro text, plan/sharing status, friend/circle management, notifications and privacy controls are only shown after expanding the profile card.
