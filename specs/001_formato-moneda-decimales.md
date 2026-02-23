# 001 — Formato de moneda, decimales y useCurrency en todas las páginas

**Estado:** pendiente
**Complejidad:** baja
**DB:** no requiere migración
**Dependencias:** ninguna

---

## Problema

1. `format.js` usa `maximumFractionDigits: 0` → sin decimales para todas las monedas.
2. Todas las páginas excepto `Deudas.jsx` usan `formatCurrency()` con COP hardcodeado, ignorando la moneda configurada por el usuario.

## Solución

### 1. Actualizar `frontend/src/utils/format.js`

Hacer los decimales inteligentes por moneda:
- **0 decimales**: COP, CLP, ARS (estas monedas no usan centavos en la práctica)
- **2 decimales**: USD, EUR, BRL, MXN, PEN, UYU, GBP

```js
const ZERO_DECIMAL_CURRENCIES = new Set(["COP", "CLP", "ARS"]);

function getFormatter(currency, locale) {
  const key = `${currency}:${locale}`;
  if (!formatterCache[key]) {
    const decimals = ZERO_DECIMAL_CURRENCIES.has(currency) ? 0 : 2;
    formatterCache[key] = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }
  return formatterCache[key];
}
```

### 2. Conectar `useCurrency()` en todas las páginas restantes

Páginas que aún usan `formatCurrency()` con defaults:
- `frontend/src/pages/Dashboard.jsx`
- `frontend/src/pages/Transacciones.jsx`
- `frontend/src/pages/Estadisticas.jsx`
- `frontend/src/pages/Presupuesto.jsx`
- `frontend/src/pages/Cuentas.jsx`
- `frontend/src/pages/MetasAhorro.jsx`
- `frontend/src/pages/Recurrentes.jsx`

En cada una:
1. Agregar `import { useCurrency } from "../hooks/useCurrency"`
2. Agregar `const formatAmount = useCurrency()` dentro del componente
3. Reemplazar todas las llamadas `formatCurrency(valor)` por `formatAmount(valor)`
4. Eliminar el import de `formatCurrency` si ya no se usa en el archivo

### 3. Verificar `frontend/src/pages/Onboarding.jsx`

Si muestra montos durante el onboarding, aplicar el mismo fix.

## Archivos a modificar

- `frontend/src/utils/format.js`
- `frontend/src/pages/Dashboard.jsx`
- `frontend/src/pages/Transacciones.jsx`
- `frontend/src/pages/Estadisticas.jsx`
- `frontend/src/pages/Presupuesto.jsx`
- `frontend/src/pages/Cuentas.jsx`
- `frontend/src/pages/MetasAhorro.jsx`
- `frontend/src/pages/Recurrentes.jsx`

## Criterios de aceptación

- [ ] Un usuario con USD ve `$1,234.56` (no `$1,234`)
- [ ] Un usuario con COP ve `$1.234.000` (no `$1.234.000,00`)
- [ ] Cambiar moneda en perfil refleja el cambio en todas las páginas sin refrescar
- [ ] No quedan llamadas `formatCurrency(x)` sin argumento de moneda en páginas de usuario

## Notas

- `Deudas.jsx` ya está corregido (trabajo anterior) — no tocar
- `useCurrency()` lee `user?.currency || "COP"` como fallback — funciona aunque user sea null
