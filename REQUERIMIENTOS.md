# Requerimientos implementados

## Condiciones Generales

- Base del ejercicio de robots limpiadores.
- Sin obstáculos en la grilla.

## Comportamiento de los Robots

1. **Teletransportación**: Los robots se teletransportan directamente a la basura (no recorren celda por celda).
2. **Sin rastro**: No muestran rastro del movimiento.
3. **Ciclo**: Aparecen en la basura, limpian, desaparecen, aparecen en otra basura.
4. **Simultáneos**: Todos los robots se mueven al mismo tiempo.
5. **Robot sin basura**: Si un robot termina de limpiar y no hay más basura, se queda quieto.
6. **Sin colisiones**: Los robots no se chocan entre sí.

## Generación Aleatoria

1. **Tamaño de grilla**: Configurable por el usuario (X e Y, de 3 a 16).
2. **Cantidad de basura**: Aleatoria, estrictamente menor al 50% del total de celdas.
3. **Cantidad de robots**: Aleatoria, menor o igual a la cantidad de basura.
   - Ejemplo válido: 3 robots y 15 basuras.
   - Ejemplo válido: 5 robots y 6 basuras.
   - NO válido: 8 robots y 5 basuras.

## Asignación de Basuras

- Estrategia greedy nearest-neighbor: se reparten todas las basuras entre los robots (round-robin, cada uno toma la más cercana disponible).
- Cada robot puede limpiar múltiples basuras.

## Estadísticas Finales

- Panel lateral al completar mostrando por cada robot:
  - Basuras recolectadas.
  - Detalle expandible: lista ordenada de celdas limpiadas con coordenadas (x,y).
- Fila de totales.

## Características Extras

- **Control de velocidad (delay)**: Slider + input numérico (150ms a 1200ms) ajustable en tiempo real.
- **Animación de teletransportación**: Efecto visual al aparecer el robot en cada celda.
- **Animación de limpieza**: La celda recién limpiada se ilumina brevemente en verde.
- **Confeti**: Animación de confeti al completar la limpieza.
- **Panel lateral de resultados**: No tapa la cuadrícula; se puede cerrar para inspeccionar.
- **Diseño dark mode**: Interfaz sobria y moderna con Tailwind CSS, iconos Lucide React.

## Almacenamiento de estadísticas (futuro)

Pendiente para implementar en una fase posterior.

## Stack tecnológico

- Vite + React + TypeScript
- Tailwind CSS v4
- Lucide React (iconos)
- react-confetti (confeti al completar)
