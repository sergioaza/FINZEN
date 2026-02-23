# 003 — Consistencia visual, i18n restante y transiciones

**Estado:** pendiente
**Complejidad:** baja
**DB:** no requiere migración
**Dependencias:** 001 (para que los valores ya tengan formato correcto antes de ajustar UI)

---

## Problemas

1. Labels del sidebar hardcodeados en español (no usan i18n).
2. Hovers y transiciones inconsistentes especialmente en dark mode.
3. Coherencia estética general entre páginas.
4. El título de página en el topbar no cambia con el idioma (hardcodeado en `PAGE_TITLES`).

---

## Solución

### 1. Sidebar i18n

En `frontend/src/components/Layout/Sidebar.jsx`:

El array `navItems` tiene labels hardcodeados. Opciones:
- **Opción A (recomendada)**: usar claves i18n en el array y `t()` al renderizar
- **Opción B**: mover labels a los locales directamente

```js
// en navItems, cambiar label por clave i18n:
{ to: "/", labelKey: "nav.dashboard", icon: "..." }

// al renderizar:
const { t } = useTranslation();
// ...
{t(item.labelKey)}
```

### 2. PAGE_TITLES dinámico en App.jsx

El `title` que se pasa al `Topbar` está hardcodeado en `PAGE_TITLES`. Opciones:
- Pasar la clave i18n en lugar del string, y que el Topbar use `t()`
- O calcular el título dinámicamente a partir del pathname usando `t()`

Implementación sugerida en `AppLayout`:
```js
const { t } = useTranslation();
const PAGE_TITLE_KEYS = {
  "/": "nav.dashboard",
  "/transacciones": "nav.transactions",
  // ...
};
const titleKey = PAGE_TITLE_KEYS[location.pathname];
const title = titleKey ? t(titleKey) : "FinZen";
```

### 3. Hovers y transiciones dark mode

Auditar los componentes principales y asegurar que todos tengan:
- `transition-colors duration-150` en elementos interactivos
- `dark:hover:` clases correctas (algunos elementos en dark mode no tienen estado hover visible)

Componentes a revisar:
- `components/common/Button.jsx` — verificar variantes en dark mode
- `components/common/Input.jsx` — border focus en dark mode
- `components/common/Modal.jsx` — backdrop y contenedor
- `components/Layout/Topbar.jsx` — botones e iconos

### 4. Coherencia estética general

Revisar que todas las páginas usen el mismo patrón de card:
```html
<div class="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
```

Páginas donde puede variar: `Estadisticas`, `Presupuesto`, `Recurrentes`.

## Archivos a modificar

- `frontend/src/components/Layout/Sidebar.jsx`
- `frontend/src/App.jsx` (PAGE_TITLES → claves i18n)
- `frontend/src/components/common/Button.jsx`
- `frontend/src/components/common/Input.jsx`
- `frontend/src/components/common/Modal.jsx`
- `frontend/src/components/Layout/Topbar.jsx`
- Páginas con inconsistencias visuales detectadas en la auditoría

## Criterios de aceptación

- [ ] Cambiar idioma a inglés traduce también los labels del sidebar y el topbar
- [ ] Todos los botones e inputs tienen hover visible en dark mode
- [ ] Las cards de todas las páginas tienen el mismo estilo base
- [ ] No hay transiciones bruscas (sin `duration`) en elementos interactivos

## Notas

- Primero ejecutar spec 001 para que el formato de moneda ya esté correcto
- Esta es la más subjetiva de las features — priorizar funcional sobre cosmético
