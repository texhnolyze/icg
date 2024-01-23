#version 300 es
precision highp float;

in vec3 vfColor;
out vec4 fColor;

void main()
{
  fColor = vec4(vfColor, 1.0);
}
