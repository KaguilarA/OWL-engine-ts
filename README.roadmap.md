# OWL Engine — Hoja de ruta

Objetivo: evolucionar el motor JavaScript/TypeScript hacia una herramienta completa
para crear, editar, probar y publicar juegos 2D. Unreal sirve como referencia de
flujo de trabajo; el alcance de este proyecto sigue siendo 2D y orientado a web.

Este documento registra trabajo pendiente. Las casillas se marcan únicamente
cuando la funcionalidad está implementada y verificada. Las fases indican el
orden recomendado, no fechas ni compromisos de entrega.

## Reglas obligatorias

1. **Estado reactivo:** el estado mutable y observable utiliza `SignalValue` y
   valores derivados de `reactive-values`, sin duplicarlo en campos ordinarios.
2. **Responsabilidades separadas:** cada módulo tiene una responsabilidad clara.
   Los módulos superiores dependen de contratos compartidos en `interfaces/`.
3. **Servicios compartidos:** aplicar SOLID y mantener singleton los servicios
   globales. El estado de escenas, entidades y juegos pertenece a sus instancias.

- Todos los juegos deben ser completamente jugables con controles táctiles en
  celulares y tabletas, incluidas todas las acciones necesarias para avanzar.
- Mantener disponibles los controles de teclado y permitir entradas simultáneas.
- Validar disposición y uso en orientación vertical y horizontal.
- Liberar entradas, listeners y recursos al cerrar una escena o un juego.
- Cada capacidad nueva debe incluir documentación y verificación adecuada.

## Base existente

El motor ya dispone de estas bases; su presencia no implica que estén completas
para un flujo de edición visual:

- Ciclo de juego, pausa, reinicio y navegación al selector mediante `BaseGame`.
- Escenas, capas, cámara 2D, contenedores y tilemaps.
- Entidades, componentes, transformaciones y prefabs mediante fábricas de código.
- Carga de imágenes, audio y atlas.
- Animación de sprites, runtime Spine y partículas.
- Audio con controles de volumen y pausa por visibilidad.
- Entrada de teclado y puntero, y controles táctiles compartidos.
- Primitivas de colisión y un mundo físico con paso fijo centrado en círculos.
- Primitivas reutilizables de movimiento y gameplay.
- Servicio de guardado JSON por juego y ranura, con versión y validación.

El guardado actual no serializa automáticamente escenas, entidades ni componentes.
Los prefabs actuales todavía no son documentos editables desde un inspector.

## Fase 1 — Escenas y componentes definidos como datos

Prioridad principal: establecer el formato que usarán el runtime y el editor.

- [ ] Definir un documento de proyecto con configuración, escena inicial y assets.
- [ ] Definir un formato versionado de escenas independiente de objetos en memoria.
- [ ] Asignar identificadores persistentes a entidades, componentes y recursos.
- [ ] Crear un registro de tipos de componentes y sus fábricas de reconstrucción.
- [ ] Declarar propiedades editables con tipos, valores por defecto y validación.
- [ ] Serializar y reconstruir entidades, componentes, capas y cámara.
- [ ] Resolver referencias entre objetos después de reconstruir sus instancias.
- [ ] Añadir jerarquías de entidades y transformaciones locales y globales.
- [ ] Definir migraciones para documentos de versiones anteriores.
- [ ] Informar errores de referencias, tipos o propiedades sin perder el documento.

**Criterio de cierre:** guardar una escena, cargarla de nuevo y recuperar sus
objetos, propiedades y referencias sin escribir código específico para ese nivel.

## Fase 2 — Gestión del ciclo de vida de escenas

- [ ] Crear un gestor compartido para registrar, cargar, activar y descargar escenas.
- [ ] Definir estados de carga, entrada, ejecución, pausa y salida.
- [ ] Separar los recursos propios de una escena de los recursos compartidos.
- [ ] Incorporar pantallas de carga, progreso, errores y reintento.
- [ ] Permitir transiciones entre menú, niveles y resultados.
- [ ] Definir cómo conservar el progreso entre cambios de escena.
- [ ] Verificar que entrar y salir repetidamente no duplique listeners ni entidades.

**Criterio de cierre:** recorrer menú, nivel y resultados, volver al menú y repetir
el recorrido sin controles retenidos ni recursos de escenas anteriores.

## Fase 3 — Acciones de entrada y compatibilidad de dispositivos

- [x] Definir acciones como `move`, `jump`, `attack`, `dash`, `interact` y `pause`.
- [x] Soportar acciones digitales y ejes analógicos.
- [x] Mapear teclado, puntero, táctil y gamepad a esas acciones.
- [x] Exponer estados de pulsación, mantenimiento y liberación.
- [x] Permitir reasignación y persistencia de preferencias mediante API.
- [x] Separar contextos de entrada de menú y gameplay y ofrecer registro para el editor.
- [x] Añadir controles táctiles configurables por juego y acción.
- [x] Adaptar tamaño, posición y áreas seguras a celulares y tabletas.
- [x] Manejar multitáctil, cancelación de punteros y pérdida de foco.
- [x] Migrar los juegos existentes para que no dependan de teclas concretas.
- [ ] Añadir una pantalla de configuración para reasignar controles y restaurar valores.
- [ ] Verificar todos los juegos en dispositivos físicos móviles y tabletas.
- [ ] Validar recorridos completos con gamepad y completar navegación de juegos basados en tablero.

La base está implementada en `GameInput`: acciones reactivas, perfiles `gameplay`,
`moonfall`, `menu` y `editor`, reasignación por contexto y preferencias versionadas
mediante `GameSaves`. El selector y `BaseGame` muestrean la entrada una vez por
frame. Los juegos de tablero conservan su interacción directa por puntero; la
migración elimina las lecturas de teclas concretas, pero no sustituye la validación
de cada juego con todos los dispositivos. El contexto del futuro editor está
disponible como API; su interfaz corresponde a la fase 4.

**Criterio de cierre:** jugar un nivel completo sin teclado, mover y actuar a la
vez, y utilizar el mismo comportamiento de juego desde teclado y gamepad.

## Fase 4 — Editor visual mínimo

Depende del formato de escenas y del registro de componentes de la fase 1.

- [ ] Separar el editor del runtime exportado de los juegos.
- [ ] Crear una vista del nivel con desplazamiento y zoom.
- [ ] Mostrar árbol de entidades y capas, con selección y búsqueda.
- [ ] Crear un inspector basado en los metadatos de propiedades editables.
- [ ] Añadir y eliminar entidades y componentes desde el editor.
- [ ] Mover, rotar y escalar mediante herramientas visuales.
- [ ] Incorporar cuadrícula, ajuste y duplicación de objetos.
- [ ] Implementar comandos reversibles para deshacer y rehacer.
- [ ] Guardar, abrir y recuperar documentos con cambios pendientes.
- [ ] Incorporar ejecutar, pausar, avanzar un paso y detener.
- [ ] Mantener separado el estado de edición del estado temporal de la partida.

**Criterio de cierre:** construir y guardar un nivel sencillo desde el editor,
probarlo y detenerlo recuperando el estado de edición original.

## Fase 5 — Assets, prefabs y mapas

- [ ] Crear un navegador de assets con búsqueda, carpetas y previsualización.
- [ ] Introducir un catálogo con identificadores y dependencias de recursos.
- [ ] Definir importación, reimportación y configuración por tipo de asset.
- [ ] Detectar referencias rotas al mover, renombrar o eliminar contenido.
- [ ] Añadir carga y descarga de recursos por escena.
- [ ] Convertir los prefabs en documentos serializables y editables.
- [ ] Permitir cambios por instancia y actualización desde el prefab original.
- [ ] Importar mapas de una herramienta externa, como Tiled o LDtk.
- [ ] Editar tilemaps con pincel, borrado, relleno y capas.
- [ ] Configurar colisiones, puntos de aparición y propiedades de tiles y objetos.
- [ ] Optimizar mapas grandes mediante regiones y descarte de contenido fuera de cámara.

**Criterio de cierre:** importar contenido, crear un prefab, reutilizarlo en varias
escenas y actualizarlo manteniendo los cambios explícitos de cada instancia.

## Fase 6 — Física y consultas del mundo

- [ ] Ampliar las formas soportadas con cajas y polígonos convexos.
- [ ] Definir cuerpos estáticos, dinámicos y cinemáticos.
- [ ] Incorporar sensores y eventos de inicio, permanencia y fin de contacto.
- [ ] Añadir capas y máscaras de colisión.
- [ ] Exponer consultas de punto, área y rayos.
- [ ] Incorporar una fase amplia para reducir las parejas de colisión evaluadas.
- [ ] Resolver el paso de objetos rápidos a través de obstáculos.
- [ ] Integrar colisiones de tilemaps y plataformas de una sola dirección.
- [ ] Añadir herramientas para visualizar cuerpos, contactos y consultas.
- [ ] Evaluar restricciones y articulaciones cuando los juegos las requieran.

**Criterio de cierre:** construir una escena con terreno, obstáculos, sensores y
objetos móviles sin implementar un sistema de colisiones distinto en cada juego.

## Fase 7 — Animación y comportamiento

- [ ] Crear máquinas de estados reutilizables para personajes y objetos.
- [ ] Añadir un controlador de animación con parámetros y transiciones.
- [ ] Emitir eventos de animación para sonido, impactos y efectos.
- [ ] Implementar interpolaciones y una línea de tiempo para secuencias.
- [ ] Coordinar cámara, animación, audio y eventos desde secuencias.
- [ ] Añadir bases de IA reutilizables: percepción, decisiones y navegación 2D.
- [ ] Definir contratos de comportamiento que pueda consumir un editor de nodos.
- [ ] Crear lógica visual básica con eventos, condiciones, acciones y variables.
- [ ] Validar grafos y permitir inspeccionar su ejecución.

**Criterio de cierre:** configurar un personaje con reposo, movimiento, salto,
ataque y daño mediante datos y componentes reutilizables. La lógica visual se
construye después de estabilizar estos contratos.

## Fase 8 — UI y audio de producción

- [ ] Ampliar UI con paneles, listas, barras, campos y controles de selección.
- [ ] Definir anclajes, distribución, escalado, temas y áreas seguras.
- [ ] Gestionar foco y navegación mediante teclado, táctil y gamepad.
- [ ] Incorporar localización y adaptación de textos de diferente longitud.
- [ ] Añadir herramientas visuales para construir menús y HUD.
- [ ] Ampliar audio con grupos de mezcla, fundidos y límites de voces simultáneas.
- [ ] Añadir audio posicional 2D y eventos de sonido reutilizables.
- [ ] Persistir preferencias de audio, controles y accesibilidad.

**Criterio de cierre:** reutilizar menús y HUD en varios juegos y dispositivos sin
recalcular manualmente todas sus posiciones.

## Fase 9 — Guardado integrado

- [ ] Definir qué estado es persistente y qué estado es temporal por componente.
- [ ] Integrar progreso, escena actual y entidades persistentes con `GameSaves`.
- [ ] Añadir checkpoints y una política configurable de autoguardado.
- [ ] Mostrar ranuras, fechas, errores y opciones para continuar o iniciar partida.
- [ ] Implementar migraciones del estado de juego con pruebas de compatibilidad.
- [ ] Permitir exportar e importar partidas con validación.
- [ ] Evaluar almacenamiento asíncrono para partidas que excedan el uso de JSON pequeño.

**Criterio de cierre:** cerrar el juego, abrirlo y continuar con escena, progreso y
estado persistente correctos, incluso después de una migración soportada.

## Fase 10 — Diagnóstico y rendimiento

- [ ] Añadir un panel con FPS, duración de frames y tiempo por sistema.
- [ ] Mostrar número de entidades, cuerpos, partículas y recursos cargados.
- [ ] Incorporar una consola con errores asociados a escenas y objetos.
- [ ] Visualizar límites, pivotes, colisiones, cámaras y regiones táctiles.
- [ ] Crear escenas de referencia para medir rendimiento en escritorio y móvil.
- [ ] Establecer presupuestos medidos de carga, memoria y tiempo por frame.
- [ ] Definir un contrato de renderizado independiente de Canvas 2D.
- [ ] Evaluar e incorporar WebGL cuando las mediciones justifiquen el cambio.
- [ ] Añadir agrupación de dibujado y efectos GPU según las necesidades medidas.
- [ ] Evaluar iluminación 2D, sombras y posprocesado sobre ese renderizador.

**Criterio de cierre:** identificar y reproducir cuellos de botella, comparar
mejoras con mediciones y mantener objetivos explícitos por dispositivo.

## Fase 11 — Proyectos, distribución y extensiones

- [ ] Separar el paquete del motor de los juegos de demostración.
- [ ] Crear una plantilla para iniciar proyectos independientes.
- [ ] Añadir validación de referencias y contenido antes de exportar.
- [ ] Exportar únicamente runtime y recursos necesarios para el juego elegido.
- [ ] Documentar publicación web y configuración de rutas y recursos.
- [ ] Evaluar instalación como PWA y funcionamiento sin conexión.
- [ ] Evaluar empaquetado para escritorio y móvil según plataformas objetivo.
- [ ] Establecer versionado de API y una guía de migración del motor.
- [ ] Definir puntos de extensión para componentes, importadores y herramientas.
- [ ] Añadir documentación de API, tutorial inicial y proyectos de ejemplo.
- [ ] Automatizar las verificaciones relevantes en integración continua.

**Criterio de cierre:** crear un proyecto nuevo, construir un juego y publicarlo
sin copiar manualmente el catálogo de demostraciones ni modificar el motor.

## Primer hito integrado

- [ ] Crear un nivel con personaje, enemigos y obstáculos definidos como datos.
- [ ] Configurar propiedades y referencias desde un inspector mínimo.
- [ ] Guardar el nivel y volver a abrirlo sin perder su composición.
- [ ] Ejecutarlo y detenerlo sin alterar el documento de edición.
- [ ] Jugarlo con teclado y con controles táctiles completos.
- [ ] Cambiar entre menú y nivel liberando los recursos correspondientes.

Este hito combina las fases 1–4 con las capacidades existentes. Es el primer
objetivo verificable para pasar de escribir cada nivel en código a construirlo
mediante herramientas.

## Alcance posterior

Multijugador, sincronización en la nube y colaboración simultánea en el editor
requieren diseño propio. Se mantienen fuera del primer hito y no deben retrasar
la base de escenas, componentes, entrada y edición.
