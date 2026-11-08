# Namecard UI work

- Follow the [PIP integration and contribution skill](https://github.com/WhiteKiwi/skills/tree/main/skills/kiwi-design-system), using the installed skill when available.
- Keep the static HTML/JS architecture. The build copies matching versioned PIP token/UI CSS exports; React is not loaded in the browser.
- Use PIP native patterns for shared controls. Theme persistence, card-side state, analytics, assets, and contact data remain product-owned.
- Before closing UI work, resolve new local controls or overrides as existing reuse, an authorized shared contribution and adoption, product-only behavior, or a tracked gap with the next action. Reuse existing contribution authorization.
- Run pnpm build and pnpm check. Verify affected controls in both themes and narrow/desktop views, including keyboard selection, focus and reduced motion.
