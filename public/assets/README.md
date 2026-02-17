# Public Assets

This directory contains static assets for the KIKA platform.

## Structure

- `images/`: General images used in the application.
- `logos/`: Branding logos (e.g., KIKA logo, partner logos).
- `backgrounds/`: Background images and patterns.
- `icons/`: Custom icons that are not part of an icon library.

## Usage in Next.js

Assets placed in the `public` folder can be referenced starting from the base URL (`/`).

Example:
If you have an image at `public/assets/logos/kika-logo.png`, you can reference it in your code like this:

```tsx
import Image from 'next/image';

<Image
  src="/assets/logos/kika-logo.png"
  alt="KIKA Logo"
  width={100}
  height={50}
/>
```

Or in CSS:

```css
.background {
  background-image: url('/assets/backgrounds/hero-bg.jpg');
}
```
