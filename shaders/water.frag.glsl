#version 300 es
precision highp float;

in vec4 cameraPosition;
in vec4 cameraNormal;
in vec4 lightPositionCamera;

in vec2 vfTextureCoordinates;

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

uniform sampler2D diffuseMap;
// TODO 1.2: Füge Normal Map als uniforme Variable hinzu.
uniform sampler2D normalMap;

out vec4 fColor;

void main()
{
  // TODO	1.5: Berechne (normalisierte) Normale, Tangente und Binormale im Kameraraum
  vec3 N = normalize(cameraNormal.xyz);
  vec3 T = normalize(cross(N, vec3(0.0, 0.0, 1.0)));
  vec3 B = cross(N, T);

  // TODO 1.6: Stelle TBN-Matrix zur Transformation vom Kamera- in den Tangentenraum auf.
  mat3 TBN = mat3(T, B, N);

  // TODO 1.7: Lese Normale aus Normal Map aus, verschiebe ihren Wertebereich und transformiere sie anschließend mit der TBN-Matrix vom Tangentenraum in den Kameraraum. (Kommentiere hiezu zunächst die folgende Zeile aus.)
  vec3 NTangent = texture(normalMap, vfTextureCoordinates).xyz * 2.0 - 1.0;
  vec3 NCamera = normalize(TBN * NTangent);
  N = NCamera;

  // Calculate and normalize L, V and R
  vec3 L = normalize(lightPositionCamera.xyz - cameraPosition.xyz);
  vec3 V = normalize((-cameraPosition).xyz);
  vec3 R = reflect(-L, N);

  vec4 ambientIntensity = Ia * ka;
  vec4 diffuseColor = texture(diffuseMap, vfTextureCoordinates);
  vec4 diffuseIntensity = Id * diffuseColor * max(0.0, dot(N, L));
  vec4 specularIntensity = Is * ks * pow(max(0.0, dot(V, R)), specExp);

  float d = length(lightPositionCamera - cameraPosition);
  float f_att = min(1.0 / (c1 + c2 * d + c3 * d * d), 1.0);

  fColor = ambientIntensity +  f_att * (diffuseIntensity + specularIntensity);
}
