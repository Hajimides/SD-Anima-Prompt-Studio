import vertexSource from './vertex.glsl';
import fragmentSource from './fragment.glsl';

export function initShaderBackground(canvas: HTMLCanvasElement): () => void {
  const gl =
    canvas.getContext('webgl', { alpha: false }) ||
    canvas.getContext('experimental-webgl', { alpha: false });

  if (!gl || !(gl instanceof WebGLRenderingContext)) {
    canvas.classList.add('webgl-fallback');
    return () => {};
  }

  const glContext = gl as WebGLRenderingContext;

  function createShader(type: number, source: string): WebGLShader | null {
    const shader = glContext.createShader(type);
    if (!shader) return null;
    glContext.shaderSource(shader, source);
    glContext.compileShader(shader);
    if (!glContext.getShaderParameter(shader, glContext.COMPILE_STATUS)) {
      console.warn('Shader compile error:', glContext.getShaderInfoLog(shader));
      glContext.deleteShader(shader);
      return null;
    }
    return shader;
  }

  function createProgram(vs: WebGLShader, fs: WebGLShader): WebGLProgram | null {
    const program = glContext.createProgram();
    if (!program) return null;
    glContext.attachShader(program, vs);
    glContext.attachShader(program, fs);
    glContext.linkProgram(program);
    if (!glContext.getProgramParameter(program, glContext.LINK_STATUS)) {
      console.warn('Program link error:', glContext.getProgramInfoLog(program));
      glContext.deleteProgram(program);
      return null;
    }
    return program;
  }

  const vertexShader = createShader(gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = createShader(gl.FRAGMENT_SHADER, fragmentSource);

  if (!vertexShader || !fragmentShader) {
    canvas.classList.add('webgl-fallback');
    return () => {};
  }

  const program = createProgram(vertexShader, fragmentShader);
  if (!program) {
    canvas.classList.add('webgl-fallback');
    return () => {};
  }

  glContext.useProgram(program);

  const positionBuffer = glContext.createBuffer();
  glContext.bindBuffer(glContext.ARRAY_BUFFER, positionBuffer);
  glContext.bufferData(
    glContext.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    glContext.STATIC_DRAW
  );

  const positionLocation = glContext.getAttribLocation(program, 'a_position');
  glContext.enableVertexAttribArray(positionLocation);
  glContext.vertexAttribPointer(positionLocation, 2, glContext.FLOAT, false, 0, 0);

  const resolutionLocation = glContext.getUniformLocation(program, 'u_resolution');
  const timeLocation = glContext.getUniformLocation(program, 'u_time');

  let running = true;
  let rafId = 0;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    glContext.viewport(0, 0, canvas.width, canvas.height);
    if (resolutionLocation) {
      glContext.uniform2f(resolutionLocation, canvas.width, canvas.height);
    }
  }

  let startTime = performance.now();

  function render(now: number) {
    if (!running) return;
    const time = (now - startTime) / 1000.0;
    if (timeLocation) {
      glContext.uniform1f(timeLocation, time);
    }
    glContext.drawArrays(glContext.TRIANGLE_STRIP, 0, 4);
    rafId = requestAnimationFrame(render);
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  function handleMotionChange() {
    if (prefersReducedMotion.matches) {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
    } else {
      running = true;
      startTime = performance.now();
      rafId = requestAnimationFrame(render);
    }
  }

  window.addEventListener('resize', resize);
  prefersReducedMotion.addEventListener('change', handleMotionChange);
  resize();

  if (!prefersReducedMotion.matches) {
    rafId = requestAnimationFrame(render);
  }

  return () => {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    window.removeEventListener('resize', resize);
    prefersReducedMotion.removeEventListener('change', handleMotionChange);
  };
}
