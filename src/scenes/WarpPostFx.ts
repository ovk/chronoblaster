const fragShader = `
#define SHADER_NAME TIME_WARP

precision mediump float;

uniform sampler2D uMainSampler;
uniform float uTime;
uniform vec2 uCenter;
uniform float uRadius;

varying vec2 outTexCoord;

void main()
{
    float dist = distance(gl_FragCoord.xy, uCenter);

    if (dist < uRadius) {
      float reldist = dist / uRadius;
      vec2 warp = vec2(cos(dist * 0.2 + uTime), sin(dist * 0.2 + uTime));
      vec2 tc = warp * reldist * 0.005 + outTexCoord;
      gl_FragColor = texture2D(uMainSampler, tc) * (1.3 - 0.5 * pow(reldist, 3.0));
    } else
      gl_FragColor = texture2D(uMainSampler, outTexCoord);
}
`;

export default class WarpPostFx extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  center = new Phaser.Math.Vector2();
  radius = 1;

  constructor(game: Phaser.Game) {
    super({
      name: 'timewarp',
      game,
      renderTarget: true,
      fragShader
    });
  }

  onPreRender() {
    this.set1f('uTime', this.game.loop.time / 1000);
    this.set1f('uRadius', this.radius);
    this.set2f('uCenter', this.center.x, this.renderer.height - this.center.y);
  }
}

