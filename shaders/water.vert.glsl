#version 300 es
precision highp float;

in vec4 vPosition;
in vec4 vNormal;
in vec2 vTextureCoordinates;

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

uniform vec3 lightPosition;

out vec4 cameraPosition;
out vec4 cameraNormal;
out vec4 lightPositionCamera;

out vec2 vfTextureCoordinates;

void main()
{
  mat4 modelViewMatrix = uViewMatrix * uModelMatrix;
  mat4 normalMatrix = transpose(inverse(modelViewMatrix));

  cameraPosition = modelViewMatrix * vPosition;
  cameraNormal = normalMatrix * vNormal;
  lightPositionCamera = uViewMatrix * vec4(lightPosition, 1.0);

  gl_Position = uProjectionMatrix * cameraPosition;
  vfTextureCoordinates = vTextureCoordinates;
}
