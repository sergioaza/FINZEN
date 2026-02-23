# 006 — Performance: cold start, registro lento y loading states globales

**Estado:** pendiente
**Complejidad:** baja
**DB:** no requiere migración
**Dependencias:** ninguna (puede hacerse en cualquier momento)

---

## Problema raíz

El registro y login lentos **no son bugs de código** — son consecuencia del cold start de Render free tier. Después de 15 minutos de inactividad, el servidor duerme y la primera request tarda 30-60 segundos.

El código de registro en sí es eficiente: un bcrypt hash + 17 inserts en una sola transacción.

---

## Solución en dos partes

### Parte 1: Evitar el cold start (sin código)

Configurar **UptimeRobot** (gratuito) para hacer ping cada 14 minutos:

1. Verificar que existe `GET /health` en el backend. Si no, agregar en `backend/app/main.py`:
   ```python
   @app.get("/health", tags=["system"])
   def health_check():
       return {"status": "ok"}
   ```
2. En UptimeRobot (uptimerobot.com):
   - Crear monitor tipo "HTTP(s)"
   - URL: `https://<nombre>.onrender.com/health`
   - Intervalo: 5 minutos (plan gratuito permite hasta 50 monitores a 5 min)
   - Alerta de email si cae (opcional pero recomendado)

### Parte 2: UX para cuando el cold start ocurra igual

En `frontend/src/pages/Login.jsx` y `Register.jsx`:

**Loading state con mensaje de espera progresivo:**

```jsx
const [slowWarning, setSlowWarning] = useState(false);

const handleSubmit = async () => {
  setLoading(true);
  const timer = setTimeout(() => setSlowWarning(true), 4000);
  try {
    await authApi.login(data);
    // ...
  } finally {
    clearTimeout(timer);
    setSlowWarning(false);
    setLoading(false);
  }
};

// En el JSX:
{slowWarning && (
  <p className="text-sm text-gray-400 text-center animate-pulse">
    Conectando con el servidor, un momento...
  </p>
)}
```

**Deshabilitar el botón durante la request** (ya debería estar, verificar):
```jsx
<Button disabled={loading} onClick={handleSubmit}>
  {loading ? "Cargando..." : "Iniciar sesión"}
</Button>
```

### Parte 3: Verificar loading states en todas las páginas

Auditar que cada página tenga el patrón correcto:
```jsx
if (loading) return <div className="flex justify-center py-12">
  <div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
</div>;
```

Páginas a verificar: `Dashboard`, `Transacciones`, `Estadisticas`, `Presupuesto`, `Recurrentes`, `Cuentas`, `MetasAhorro`.

---

## Archivos a modificar

- `backend/app/main.py` (endpoint /health)
- `frontend/src/pages/Login.jsx`
- `frontend/src/pages/Register.jsx`
- Páginas sin loading state correcto (identificar en auditoría)

## Criterios de aceptación

- [ ] `GET /health` responde `{"status": "ok"}`
- [ ] UptimeRobot configurado y monitoreando
- [ ] Login/registro muestran spinner durante la request
- [ ] Si la request tarda más de 4s aparece mensaje "Conectando con el servidor..."
- [ ] Ninguna página muestra pantalla en blanco durante fetch inicial

## Notas

- UptimeRobot gratuito: 50 monitores, intervalo mínimo 5 minutos
- Alternativa gratuita: cron-job.org (más flexible para intervalos)
- Si el tráfico crece, considerar upgrade a Render Starter ($7/mes) — sin cold start
- Este spec solapa con partes del spec 002 — coordinar para no duplicar trabajo
