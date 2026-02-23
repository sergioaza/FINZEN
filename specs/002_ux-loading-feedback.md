# 002 — Loading indicators, freeze fix y protección de formularios

**Estado:** pendiente
**Complejidad:** baja
**DB:** no requiere migración
**Dependencias:** ninguna

---

## Problemas

1. **Render cold start**: primer request tras 15 min de inactividad tarda 30-60s. La app parece congelada.
2. **Sin loading states**: botones no dan feedback, parece que la página no responde.
3. **Borrado accidental**: clic fuera de un modal cierra el formulario y se pierde lo escrito.
4. **Botón "limpiar" en transacciones**: no tiene confirmación, borra filtros/formulario sin aviso.

---

## Solución

### 1. Keep-alive para Render free tier (sin código)

Configurar **UptimeRobot** (gratuito) para hacer ping al endpoint de health cada 14 minutos:
- URL a monitorear: `https://<render-service>.onrender.com/health`
- Verificar que el backend tenga un endpoint `GET /health` que responda `{"status": "ok"}`

Si no existe el endpoint, agregarlo en `backend/app/main.py`:
```python
@app.get("/health")
def health():
    return {"status": "ok"}
```

### 2. Loading state en login y registro

En `frontend/src/pages/Login.jsx` y `Register.jsx`:
- El botón de submit debe mostrar spinner + texto "Iniciando sesión..." / "Creando cuenta..."
- Deshabilitar el botón durante la request para evitar doble submit
- Agregar mensaje debajo del formulario: "Esto puede tardar unos segundos la primera vez" (solo visible si la request lleva más de 3 segundos sin respuesta)

Implementar con `setTimeout`:
```js
const [slowWarning, setSlowWarning] = useState(false);
// al hacer submit:
const timer = setTimeout(() => setSlowWarning(true), 3000);
// al recibir respuesta:
clearTimeout(timer); setSlowWarning(false);
```

### 3. Loading states en todas las páginas (fetch inicial)

Todas las páginas tienen `loading` state pero el spinner solo aparece en algunas. Verificar y asegurar que:
- Mientras `loading === true` se muestra un spinner centrado (ya existe el patrón en `Deudas.jsx`)
- No se muestra contenido vacío ni errores prematuros

### 4. Protección de modales con datos

En el componente `frontend/src/components/common/Modal.jsx`:
- Leer la prop actual `onClose`
- Agregar prop `preventCloseOnBackdrop?: boolean`
- Cuando sea `true`, el clic en el backdrop no cierra el modal

En las páginas con formularios (`Transacciones`, `Deudas`, `Cuentas`, etc.):
- Pasar `preventCloseOnBackdrop={hasUnsavedData}` donde `hasUnsavedData` es `true` si algún campo del form tiene valor

Alternativa más simple: siempre prevenir clic en backdrop en modales con formularios — cambiar el comportamiento por defecto del Modal para formularios.

### 5. Confirmación en botón "limpiar" transacciones

Leer `frontend/src/pages/Transacciones.jsx` para identificar el botón "limpiar".
- Si limpia filtros de búsqueda: agregar tooltip o label más claro ("Limpiar filtros")
- Si limpia el formulario de nueva transacción: agregar confirmación si hay datos escritos

## Archivos a modificar

- `backend/app/main.py` (endpoint /health si no existe)
- `frontend/src/pages/Login.jsx`
- `frontend/src/pages/Register.jsx`
- `frontend/src/components/common/Modal.jsx`
- `frontend/src/pages/Transacciones.jsx` (botón limpiar)
- Verificar loading spinners en todas las páginas

## Criterios de aceptación

- [ ] Servidor nunca duerme (UptimeRobot configurado)
- [ ] En login/registro aparece spinner + texto de carga
- [ ] Si la request tarda >3s aparece "Esto puede tardar unos segundos..."
- [ ] Clic fuera de un modal con datos no lo cierra
- [ ] Botón limpiar tiene confirmación o label claro

## Notas

- El endpoint `/health` es buena práctica aunque no sea obligatorio para Render
- El mensaje de "primera vez" es temporal — desaparece cuando Render tenga uptime constante
