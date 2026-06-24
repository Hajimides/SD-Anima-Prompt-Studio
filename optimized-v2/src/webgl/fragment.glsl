precision mediump float;

#define S(a, b, t) smoothstep(a, b, t)

uniform vec2 u_resolution;
uniform float u_time;

mat2 Rot(float a) {
  float s = sin(a);
  float c = cos(a);
  return mat2(c, -s, s, c);
}

vec2 hash(vec2 p) {
  p = vec2(dot(p, vec2(2127.1, 81.17)), dot(p, vec2(1269.5, 283.37)));
  return fract(sin(p) * 43758.5453);
}

float noise(in vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float n = mix(
    mix(
      dot(-1.0 + 2.0 * hash(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
      dot(-1.0 + 2.0 * hash(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)),
      u.x
    ),
    mix(
      dot(-1.0 + 2.0 * hash(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
      dot(-1.0 + 2.0 * hash(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)),
      u.x
    ),
    u.y
  );
  return 0.5 + 0.5 * n;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = fragCoord / u_resolution.xy;
  float ratio = u_resolution.x / u_resolution.y;
  vec2 tuv = uv;
  tuv -= 0.5;
  float degree = noise(vec2(u_time * 0.1, tuv.x * tuv.y));
  tuv.y *= 1.0 / ratio;
  tuv *= Rot(radians((degree - 0.5) * 720.0 + 180.0));
  tuv.y *= ratio;

  float frequency = 5.0;
  float amplitude = 30.0;
  float speed = u_time * 2.0;
  tuv.x += sin(tuv.y * frequency + speed) / amplitude;
  tuv.y += sin(tuv.x * frequency * 1.5 + speed) / (amplitude * 0.5);

  vec3 colorYellow = vec3(0.18, 0.10, 0.22);
  vec3 colorDeepBlue = vec3(0.06, 0.09, 0.22);
  vec3 layer1 = mix(colorYellow, colorDeepBlue, S(-0.3, 0.2, (tuv * Rot(radians(-5.0))).x));

  vec3 colorRed = vec3(0.18, 0.10, 0.22);
  vec3 colorBlue = vec3(0.12, 0.25, 0.38);
  vec3 layer2 = mix(colorRed, colorBlue, S(-0.3, 0.2, (tuv * Rot(radians(-5.0))).x));

  vec3 finalComp = mix(layer1, layer2, S(0.5, -0.3, tuv.y));
  fragColor = vec4(finalComp, 1.0);
}

void main() {
  vec4 color;
  mainImage(color, gl_FragCoord.xy);
  gl_FragColor = color;
}
