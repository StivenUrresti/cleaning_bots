# Requerimientos implementados

## Requerimientos principales

1. **Cuadrícula configurable**: El usuario elige celdas X e Y (de 3 a 16). Puede ser cualquier tamaño, por ejemplo 10x10.

2. **Basura aleatoria estrictamente < 50%**: Si no se especifica cantidad, se genera aleatoriamente entre 1 y `floor(totalCells/2) - 1`. Nunca llega al 50%.

3. **Robots en posiciones aleatorias**: Se colocan en celdas limpias aleatorias (no en celdas sucias para que se aprecie el movimiento).

4. **Cantidad de robots = mitad o menos de basuras**: Primero se genera la basura, luego se calculan los robots: entre 1 y `floor(dirtyCount / 2)`. Nunca superan la cantidad de basura.

5. **Comportamiento deliberativo**: Los robots conocen de antemano la posición de todas las basuras. Se asignan con estrategia greedy nearest-neighbor (round-robin) y van directo a ellas por movimiento Manhattan.

6. **Cada robot puede recoger varias basuras**: Sin límite fijo. Un robot recibe tantas basuras como le toquen en la asignación.

7. **Robots no superan cantidad de basura**: Garantizado por la regla del punto 4.

8. **Trazado de ruta con color único por robot**: Cada celda por la que pasa un robot queda pintada con su color (fondo con opacidad). Si dos robots pasan por la misma celda, los colores se superponen (puntos visibles).

9. **Colores únicos por robot**: Paleta de 12 colores distinguibles en dark mode. El icono del robot y su trail usan ese color.

10. **Estadísticas finales por robot**: Panel lateral al completar mostrando por cada robot: celdas recorridas y basuras recolectadas, más fila de totales.

11. **Almacenamiento de estadísticas (futuro)**: Pendiente para implementar en una fase posterior.

## Extras implementados

- **Control de velocidad**: Slider + input numérico (150ms a 1200ms) ajustable en tiempo real, incluso durante la simulación.
- **Todos los robots actúan simultáneamente**: En cada tick todos los robots perciben y actúan al mismo tiempo, sin turnos.
- **Confeti**: Animación de confeti al completar la limpieza.
- **Panel lateral de resultados**: No tapa la cuadrícula; se puede cerrar con X para inspeccionar los trails de colores.
- **Reasignación de basuras huérfanas**: Si un robot limpia de paso una basura asignada a otro, las basuras restantes se reasignan automáticamente a robots libres.
- **Desvío inteligente**: Si el camino directo está bloqueado por otro robot, los robots intentan rodear el obstáculo probando las 4 direcciones.
- **Diseño dark mode**: Interfaz sobria y moderna con Tailwind CSS, iconos Lucide React y animaciones suaves.

## Stack tecnológico

- Vite + React + TypeScript
- Tailwind CSS v4
- Lucide React (iconos)
- react-confetti (confeti al completar)
