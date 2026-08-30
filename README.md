# moru-krds-react

React components built on the CSS of KRDS, the Korean government design system.

```bash
npm i krds-uiux moru-krds-react
```

```tsx
import 'krds-uiux/resources/cdn/krds.min.css';
import { Field, TextInput, Button } from 'moru-krds-react';

<Field id="name" label="이름" required hint="공백 없이 적어 주세요">
  {(a) => <TextInput {...a} value={name} onChange={onChange} />}
</Field>
<Button variant="primary">신청하기</Button>
```

`krds-uiux` is the official kit. It declares no `@font-face`, so wire the font yourself from
`krds-uiux/resources/fonts/`. On an air-gapped network, copy `resources/` into your static
folder and use `css/component/output.css`, which references images by relative path.

## Components

**Page frame** — masthead, header, GNB, breadcrumb, side navigation, in-page navigation,
footer, agency identifier, skip link

**Forms** — field wrapper, text input, textarea, select, checkbox, radio, file upload,
combobox, input group, button

**Data** — table, data table (sorting, sticky header, empty state), structured list,
text list, pagination

**Status** — inline alert, critical alert, toast, empty state, skeleton, spinner,
progress bar, badge, tag

**Overlays** — modal, drawer, tooltip, context menu

**Progressive disclosure** — tab, accordion, disclosure, step indicator

**Misc** — avatar, separator, scroll area, text resize

Thirteen of them have no KRDS counterpart — drawer, toast, combobox, context menu, sortable
data table and others that admin screens need. Those are drawn with KRDS tokens only.

## Notes

31 of the 45 render on the server, so the package keeps its file layout instead of bundling
into one file.

Framework coupling lives in `src/lib/link.tsx`. It defaults to a plain `<a>`; swap it for
`next/link` or React Router's `Link`.

With Tailwind v4, import `styles/krds-tailwind.css` to map utility names like `text-fg-subtle`
onto KRDS variables. Without it the components still work.

Each component keeps its rules and pitfalls in the source header.

## License

MIT. The KRDS kit is not bundled; it ships separately as `krds-uiux` under ISC.
