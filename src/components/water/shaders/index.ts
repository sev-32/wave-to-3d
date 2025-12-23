/**
 * Shader exports for water simulation
 * Re-exports all shaders from individual files
 */

// Re-export simulation shaders
export {
  SIMULATION_VERTEX_SHADER,
  DROP_FRAGMENT_SHADER,
  UPDATE_FRAGMENT_SHADER,
  NORMAL_FRAGMENT_SHADER,
  SPHERE_FRAGMENT_SHADER as SPHERE_DISPLACEMENT_FRAGMENT_SHADER,
} from './simulationShaders';

// Re-export caustics shaders
export {
  IOR_AIR,
  IOR_WATER,
  POOL_HEIGHT,
  CAUSTICS_VERTEX_SHADER,
  CAUSTICS_FRAGMENT_SHADER,
  CAUSTICS_FRAGMENT_SHADER_FALLBACK,
} from './causticsShaders';

// Re-export renderer shaders
export {
  WATER_VERTEX_SHADER,
  WATER_FRAGMENT_SHADER_ABOVE,
  WATER_FRAGMENT_SHADER_UNDERWATER,
  CUBE_VERTEX_SHADER,
  CUBE_FRAGMENT_SHADER,
  SPHERE_VERTEX_SHADER,
  SPHERE_FRAGMENT_SHADER,
} from './rendererShaders';

// Legacy exports for backward compatibility
import {
  SIMULATION_VERTEX_SHADER,
  DROP_FRAGMENT_SHADER,
  UPDATE_FRAGMENT_SHADER,
  NORMAL_FRAGMENT_SHADER,
  SPHERE_FRAGMENT_SHADER as SIM_SPHERE_FRAG,
} from './simulationShaders';

import {
  CAUSTICS_VERTEX_SHADER,
  CAUSTICS_FRAGMENT_SHADER,
  CAUSTICS_FRAGMENT_SHADER_FALLBACK,
} from './causticsShaders';

import {
  WATER_VERTEX_SHADER,
  WATER_FRAGMENT_SHADER_ABOVE,
  WATER_FRAGMENT_SHADER_UNDERWATER,
  CUBE_VERTEX_SHADER,
  CUBE_FRAGMENT_SHADER,
  SPHERE_VERTEX_SHADER,
  SPHERE_FRAGMENT_SHADER,
} from './rendererShaders';

export const simulationVertexShader = SIMULATION_VERTEX_SHADER;
export const dropFragmentShader = DROP_FRAGMENT_SHADER;
export const updateFragmentShader = UPDATE_FRAGMENT_SHADER;
export const normalFragmentShader = NORMAL_FRAGMENT_SHADER;
export const sphereDisplacementFragmentShader = SIM_SPHERE_FRAG;
export const causticsVertexShader = CAUSTICS_VERTEX_SHADER;
export const causticsFragmentShader = CAUSTICS_FRAGMENT_SHADER;
export const causticsFragmentShaderFallback = CAUSTICS_FRAGMENT_SHADER_FALLBACK;
export const waterSurfaceVertexShader = WATER_VERTEX_SHADER;
export const waterSurfaceFragmentShaderAbove = WATER_FRAGMENT_SHADER_ABOVE;
export const waterSurfaceFragmentShaderBelow = WATER_FRAGMENT_SHADER_UNDERWATER;
export const poolVertexShader = CUBE_VERTEX_SHADER;
export const poolFragmentShader = CUBE_FRAGMENT_SHADER;
export const sphereVertexShader = SPHERE_VERTEX_SHADER;
export const sphereFragmentShader = SPHERE_FRAGMENT_SHADER;
