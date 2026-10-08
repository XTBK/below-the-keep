// GLSL for the post-processing passes. All passes draw one full-screen quad.

export const fullscreenVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

/** Bright pass + 4x4 box downsample (640x360 scene -> 160x90). */
export const brightPassFragment = /* glsl */ `
  uniform sampler2D tScene;
  uniform vec2 uTexel;      // 1 / scene size
  uniform float uThreshold;
  uniform float uKnee;
  varying vec2 vUv;
  void main() {
    vec3 sum = vec3(0.0);
    for (int y = 0; y < 4; y++) {
      for (int x = 0; x < 4; x++) {
        vec2 o = (vec2(float(x), float(y)) - 1.5) * uTexel;
        vec3 c = texture2D(tScene, vUv + o).rgb;
        float br = max(c.r, max(c.g, c.b));
        float soft = clamp(br - uThreshold + uKnee, 0.0, 2.0 * uKnee);
        soft = soft * soft / (4.0 * uKnee + 1e-4);
        float contrib = max(soft, br - uThreshold) / max(br, 1e-4);
        sum += c * contrib;
      }
    }
    gl_FragColor = vec4(sum / 16.0, 1.0);
  }
`;

/** 9-tap separable gaussian. */
export const blurFragment = /* glsl */ `
  uniform sampler2D tInput;
  uniform vec2 uDir; // texel step in one direction
  varying vec2 vUv;
  void main() {
    vec3 c = texture2D(tInput, vUv).rgb * 0.2270270270;
    c += texture2D(tInput, vUv + uDir * 1.3846153846).rgb * 0.3162162162;
    c += texture2D(tInput, vUv - uDir * 1.3846153846).rgb * 0.3162162162;
    c += texture2D(tInput, vUv + uDir * 3.2307692308).rgb * 0.0702702703;
    c += texture2D(tInput, vUv - uDir * 3.2307692308).rgb * 0.0702702703;
    gl_FragColor = vec4(c, 1.0);
  }
`;

/**
 * Composite: scene + bloom -> exposure -> filmic tone map -> colour grade (split toning,
 * saturation, contrast) -> vignette -> sRGB -> HUD on top. Output is final display colour.
 */
export const compositeFragment = /* glsl */ `
  uniform sampler2D tScene;
  uniform sampler2D tBloom;
  uniform sampler2D tHud;
  uniform float uBloomStrength;
  uniform float uExposure;
  uniform float uSaturation;
  uniform float uContrast;
  uniform float uLift;
  uniform vec3 uShadowTint;
  uniform vec3 uHighlightTint;
  uniform vec3 uVignette; // strength, radius, softness
  uniform vec2 uRes;
  varying vec2 vUv;

  vec3 aces(vec3 x) {
    const float a = 2.51, b = 0.03, c = 2.43, d = 0.59, e = 0.14;
    return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
  }

  vec3 toSRGB(vec3 c) {
    vec3 lo = c * 12.92;
    vec3 hi = 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055;
    return mix(lo, hi, step(vec3(0.0031308), c));
  }

  void main() {
    vec3 c = texture2D(tScene, vUv).rgb + texture2D(tBloom, vUv).rgb * uBloomStrength;
    c = aces(c * uExposure);

    float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
    c = mix(vec3(l), c, uSaturation);
    c *= mix(uShadowTint, uHighlightTint, smoothstep(0.0, 0.5, l));

    vec2 p = (vUv - 0.5) * vec2(uRes.x / uRes.y, 1.0);
    float dist = length(p) / length(vec2(uRes.x / uRes.y, 1.0) * 0.5);
    float vig = 1.0 - uVignette.x * smoothstep(uVignette.y - uVignette.z, uVignette.y + uVignette.z * 0.5, dist);
    c *= vig;

    c = toSRGB(clamp(c, 0.0, 1.0));
    c = (c - 0.5) * uContrast + 0.5 + uLift;

    vec4 hud = texture2D(tHud, vUv);
    c = mix(c, hud.rgb, hud.a);
    gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
  }
`;

/** Plain copy (used for the final integer upscale to the screen). */
export const copyFragment = /* glsl */ `
  uniform sampler2D tInput;
  varying vec2 vUv;
  void main() {
    gl_FragColor = texture2D(tInput, vUv);
  }
`;
