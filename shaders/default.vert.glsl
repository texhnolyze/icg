#version 300 es
precision highp float;

in vec4 vPosition;
in vec4 vNormal;

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

uniform vec3 lightPosition;

uniform vec4 Ia;
uniform vec4 Id;
uniform vec4 Is;
uniform vec4 ka;
uniform vec4 kd;
uniform vec4 ks;
uniform float specExp;

const float c1 = 1.0;
const float c2 = 0.0005;
const float c3 = 0.000003;

out vec4 vfColor;

void main()
{
  mat4 modelViewMatrix = uViewMatrix * uModelMatrix;
  mat4 normalMatrix = transpose(inverse(modelViewMatrix));

  vec4 cameraPosition = modelViewMatrix * vPosition;
  vec4 normalCamera = normalMatrix * vNormal;
  vec4 lightPositionCamera = uViewMatrix * vec4(lightPosition, 1.0);

  vec3 N = normalize(normalCamera.xyz);
  vec3 L = normalize(lightPositionCamera.xyz - cameraPosition.xyz);
  vec3 V = normalize((-cameraPosition).xyz);
  vec3 R = reflect(-L, N);

  vec4 ambientIntensity = Ia * ka;
  vec4 diffuseIntensity = Id * kd * max(0.0, dot(N, L));
  vec4 specularIntensity = Is * ks * pow(max(0.0, dot(V, R)), specExp);

  float d = length(lightPositionCamera - cameraPosition);
  float f_att = min(1.0 / (c1 + c2 * d + c3 * d * d), 1.0);

  vfColor = ambientIntensity + f_att * (diffuseIntensity + specularIntensity);
  gl_Position = uProjectionMatrix * cameraPosition;
}
