---
paths:
  - "frontend/src/**/*.jsx"
  - "frontend/src/**/*.js"
  - "frontend/src/**/*.json"
---

# Reglas Frontend — React 18 + Vite + Tailwind

## Stack y convenciones
- **React 18** con componentes funcionales + hooks. Sin clases.
- **Tailwind CSS** para estilos — sin CSS-in-JS, sin módulos CSS salvo casos muy específicos.
- **Vite** como bundler. El frontend se compila a build estático servido por nginx.
- **i18next + react-i18next** para traducciones. Recursos inlineados en `src/i18n/index.js` (no HTTP backend).

## Estructura de archivos
```
src/
├── api/          ← axios.js (interceptor JWT) + módulo por entidad (debts.js, accounts.js...)
├── context/      ← AuthContext.jsx (estado global de usuario, JWT, i18n locale)
├── hooks/        ← useAuth.js, useCurrency.js
├── i18n/         ← index.js (config i18next) + locales/es.json, en.json, pt.json
├── utils/        ← format.js (formatCurrency), locale.js (COUNTRIES, CURRENCIES)
├── components/   ← Layout/ (Sidebar, Topbar) + common/ (Button, Input, Modal, Badge)
└── pages/        ← una página por entidad
```

## Reglas de componentes
- Nombres en PascalCase para componentes, camelCase para funciones/variables.
- Cada página en su propio archivo en `src/pages/`.
- Reutilizar componentes de `src/components/common/` (Button, Input, Modal, Badge).
- No crear componentes nuevos en `common/` sin necesidad real de reutilización en 3+ lugares.

## API calls
- Toda llamada a la API va a través de `src/api/axios.js` (tiene interceptor JWT automático).
- Cada entidad tiene su módulo en `src/api/` (ej: `debts.js`, `accounts.js`).
- No llamar a `axios` directamente desde páginas — usar siempre los módulos de `src/api/`.

## Internacionalización
- Usar el hook `useTranslation()` de react-i18next para textos.
- Las claves de traducción van en los tres archivos: `es.json`, `en.json`, `pt.json`.
- El idioma cambia automáticamente al hacer login según `user.locale`.
- Nunca hardcodear strings en español directamente en el JSX si el texto es visible al usuario.

## Formateo de moneda
- Usar `useCurrency()` hook que devuelve función de formato según `user.currency`.
- `formatCurrency(amount, currency, locale)` en `utils/format.js` para casos sin contexto de usuario.
- Default fallback: `currency = "COP"`, `locale = "es-CO"`.

## Dark mode
- El Topbar y Sidebar ya tienen soporte dark mode vía Tailwind `dark:` classes.
- Nuevas páginas deben incluir clases `dark:` para los elementos principales.

## Build y deploy
- Cambios en `.jsx` o `package.json` requieren `docker compose up -d --build frontend` en local.
- En producción (Vercel): el push a `main` dispara rebuild automático.
- Variables de entorno en Vercel solo afectan el build. La URL del backend está hardcodeada en `src/api/axios.js`.
