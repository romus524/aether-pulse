import * as THREE from 'three';
import { CSISpatialState, TwinPosture } from './CSIAdapter';

const PELVIS_HEIGHT: Record<TwinPosture, number> = {
  bed: 0.58,
  sitting: 0.62,
  standing: 0.92,
  walking: 0.93,
  fallen: 0.16,
};

export const getPostureEuler = (posture: TwinPosture, heading: number): THREE.Euler => {
  switch (posture) {
    case 'bed':
      return new THREE.Euler(-Math.PI / 2 + 0.06, heading, 0, 'YXZ');
    case 'sitting':
      return new THREE.Euler(0.62, heading + Math.PI / 2, 0, 'YXZ');
    case 'fallen':
      return new THREE.Euler(0.18, heading + 0.35, Math.PI / 2.08, 'YXZ');
    case 'walking':
    case 'standing':
    default:
      return new THREE.Euler(0.02, heading, 0, 'YXZ');
  }
};

export class TwinMotionFilter {
  readonly position = new THREE.Vector3(0, 0.92, 0);
  readonly quaternion = new THREE.Quaternion();
  readonly velocity = new THREE.Vector3();
  readonly filteredRaw = new THREE.Vector3();

  private readonly targetPosition = new THREE.Vector3();
  private readonly targetQuaternion = new THREE.Quaternion();
  private readonly scratchEuler = new THREE.Euler();
  private initialized = false;

  reset(state: CSISpatialState) {
    this.filteredRaw.set(state.rawCoordinates.x, state.rawCoordinates.y, state.rawCoordinates.z);
    this.targetPosition.set(state.coordinates.x, PELVIS_HEIGHT[state.posture], state.coordinates.z);
    this.position.copy(this.targetPosition);
    this.scratchEuler.copy(getPostureEuler(state.posture, state.rotationY));
    this.quaternion.setFromEuler(this.scratchEuler);
    this.targetQuaternion.copy(this.quaternion);
    this.velocity.set(0, 0, 0);
    this.initialized = true;
  }

  update(state: CSISpatialState, dt: number) {
    if (!this.initialized) {
      this.reset(state);
      return;
    }

    const clampedDt = Math.min(Math.max(dt, 1 / 120), 0.05);

    this.filteredRaw.x = THREE.MathUtils.damp(this.filteredRaw.x, state.rawCoordinates.x, 8, clampedDt);
    this.filteredRaw.y = THREE.MathUtils.damp(this.filteredRaw.y, state.rawCoordinates.y, 10, clampedDt);
    this.filteredRaw.z = THREE.MathUtils.damp(this.filteredRaw.z, state.rawCoordinates.z, 8, clampedDt);

    const trackingMix = 0.35;
    this.targetPosition.set(
      THREE.MathUtils.lerp(state.coordinates.x, this.filteredRaw.x, trackingMix),
      PELVIS_HEIGHT[state.posture],
      THREE.MathUtils.lerp(state.coordinates.z, this.filteredRaw.z, trackingMix)
    );

    this.scratchEuler.copy(getPostureEuler(state.posture, state.rotationY));
    this.targetQuaternion.setFromEuler(this.scratchEuler);

    const previousX = this.position.x;
    const previousZ = this.position.z;
    const positionLambda = state.posture === 'fallen' ? 5.2 : state.posture === 'walking' ? 6.8 : 7.4;
    const rotationLambda = state.posture === 'walking' ? 6.2 : 5.4;

    this.position.x = THREE.MathUtils.damp(this.position.x, this.targetPosition.x, positionLambda, clampedDt);
    this.position.y = THREE.MathUtils.damp(this.position.y, this.targetPosition.y, positionLambda * 0.9, clampedDt);
    this.position.z = THREE.MathUtils.damp(this.position.z, this.targetPosition.z, positionLambda, clampedDt);
    this.quaternion.slerp(this.targetQuaternion, 1 - Math.exp(-rotationLambda * clampedDt));

    this.velocity.set(
      (this.position.x - previousX) / clampedDt,
      0,
      (this.position.z - previousZ) / clampedDt
    );
  }
}
