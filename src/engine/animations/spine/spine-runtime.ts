import { computedValue, signalValue, type ComputedValue, type SignalValue } from 'reactive-values';
import { MathUtils } from '../../core';
import type { Atlas } from '../../assets';
import type {
  SpineBoneTransform,
  SpineEvent,
  SpineEventHandler,
  SpineSlotPose,
  SpineRecord
} from '../../interfaces';

import { SpineBinaryParser } from './';

/**
 * Defines the bone state contract shared by its consumers.
 * @typedef {BoneState} BoneState
 */
type BoneState = {
  /**
   * Snapshot payload persisted by the save service.
   * @property {SpineRecord} data
   */
  data: SpineRecord;
  /**
   * Parent index configuration or state owned by BoneState.
   * @property {number} parentIndex
   */
  parentIndex: number;
  /**
   * Local pose configuration or state owned by BoneState.
   * @property {SignalValue<SpineBoneTransform>} localPose
   */
  localPose: SignalValue<SpineBoneTransform>;
  /**
   * Pose configuration or state owned by BoneState.
   * @property {SignalValue<SpineBoneTransform>} pose
   */
  pose: SignalValue<SpineBoneTransform>;
};

/**
 * Defines the ik constraint state contract shared by its consumers.
 * @typedef {IkConstraintState} IkConstraintState
 */
type IkConstraintState = {
  /**
   * Name used to identify or look up this resource.
   * @property {string} name
   */
  name: string;
  /**
   * Order configuration or state owned by IkConstraintState.
   * @property {number} order
   */
  order: number;
  /**
   * Bone indices configuration or state owned by IkConstraintState.
   * @property {number[]} boneIndices
   */
  boneIndices: number[];
  /**
   * Target index configuration or state owned by IkConstraintState.
   * @property {number} targetIndex
   */
  targetIndex: number;
  /**
   * Mix configuration or state owned by IkConstraintState.
   * @property {number} mix
   */
  mix: number;
  /**
   * Softness configuration or state owned by IkConstraintState.
   * @property {number} softness
   */
  softness: number;
  /**
   * Bend positive configuration or state owned by IkConstraintState.
   * @property {boolean} bendPositive
   */
  bendPositive: boolean;
  /**
   * Compress configuration or state owned by IkConstraintState.
   * @property {boolean} compress
   */
  compress: boolean;
  /**
   * Stretch configuration or state owned by IkConstraintState.
   * @property {boolean} stretch
   */
  stretch: boolean;
  /**
   * Override target configuration or state owned by IkConstraintState.
   * @property {SignalValue<{ x: number; y: number; } | undefined>} overrideTarget
   */
  overrideTarget: SignalValue<{
  /**
   * Horizontal coordinate in the owning coordinate space.
   * @property {number} x
   */
  x: number;
  /**
   * Vertical coordinate in the owning coordinate space.
   * @property {number} y
   */
  y: number } | undefined>;
  /**
   * Override mix configuration or state owned by IkConstraintState.
   * @property {SignalValue<number | undefined>} overrideMix
   */
  overrideMix: SignalValue<number | undefined>;
};

/**
 * High-performance Spine 2D runtime evaluating skeleton poses, animations, and inverse kinematics.
 * @class SpineRuntime
 */
export class SpineRuntime {
  /**
   * Stores internal skeleton bone nodes.
   * @property {BoneState[]} bones
   * @private
   * @readonly
   */
  private readonly bones: BoneState[];

  /**
   * Stores reactive slot states.
   * @property {SignalValue<SpineSlotPose>[]} slots
   * @private
   * @readonly
   */
  private readonly slots: SignalValue<SpineSlotPose>[];

  /**
   * Stores setup slot configuration records.
   * @property {SpineRecord[]} slotData
   * @private
   * @readonly
   */
  private readonly slotData: SpineRecord[];

  /**
   * Stores normalized skin attachment catalogs.
   * @property {Record<string, Record<string, Record<string, SpineRecord>>>} skins
   * @private
   * @readonly
   */
  private readonly skins: Record<string, Record<string, Record<string, SpineRecord>>>;

  /**
   * Stores event handler subscriptions.
   * @property {Map<string, Set<SpineEventHandler>>} handlers
   * @private
   * @readonly
   */
  private readonly handlers = new Map<string, Set<SpineEventHandler>>();

  /**
   * Stores the currently playing animation name.
   * @property {SignalValue<string | undefined>} currentAnimation
   * @private
   * @readonly
   */
  private readonly currentAnimation: SignalValue<string | undefined> = signalValue<string | undefined>(undefined);

  /**
   * Stores the playback playhead time in seconds.
   * @property {SignalValue<number>} animationTime
   * @private
   * @readonly
   */
  private readonly animationTime: SignalValue<number> = signalValue(0);

  /**
   * Stores whether animation playback is currently active.
   * @property {SignalValue<boolean>} animationPlaying
   * @private
   * @readonly
   */
  private readonly animationPlaying: SignalValue<boolean> = signalValue(false);

  /**
   * Stores whether the active animation repeats indefinitely.
   * @property {SignalValue<boolean>} animationLooping
   * @private
   * @readonly
   */
  private readonly animationLooping: SignalValue<boolean> = signalValue(false);

  /**
   * Stores the queued follow-up animation name.
   * @property {SignalValue<string | undefined>} queuedAnimation
   * @private
   * @readonly
   */
  private readonly queuedAnimation: SignalValue<string | undefined> = signalValue<string | undefined>(undefined);

  /**
   * Stores whether the queued animation loops.
   * @property {SignalValue<boolean>} queuedLooping
   * @private
   * @readonly
   */
  private readonly queuedLooping: SignalValue<boolean> = signalValue(false);

  /**
   * Stores the active skin name.
   * @property {SignalValue<string>} activeSkin
   * @private
   * @readonly
   */
  private readonly activeSkin: SignalValue<string> = signalValue('default');

  /**
   * Stores measured animation durations.
   * @property {Map<string, number>} animationDurations
   * @private
   * @readonly
   */
  private readonly animationDurations = new Map<string, number>();

  /**
   * Stores bone update topological order.
   * @property {number[]} setupOrder
   * @private
   * @readonly
   */
  private readonly setupOrder: number[];

  /**
   * Stores IK constraints sorted by evaluation order.
   * @property {IkConstraintState[]} ikConstraints
   * @private
   * @readonly
   */
  private readonly ikConstraints: IkConstraintState[];

  /**
   * Stores parsed skeleton definition record.
   * @property {SpineRecord} data
   * @private
   * @readonly
   */
  private readonly data: SpineRecord;

  /**
   * Stores the sprite atlas providing texture regions.
   * @property {Atlas} atlas
   * @public
   * @readonly
   */
  public readonly atlas: Atlas;

  /**
   * Stores whether an animation cross-fade is in progress.
   * @property {SignalValue<boolean>} blending
   * @private
   * @readonly
   */
  private readonly blending: SignalValue<boolean> = signalValue(false);

  /**
   * Stores the previous animation name during a cross-fade.
   * @property {SignalValue<string | undefined>} previousAnimation
   * @private
   * @readonly
   */
  private readonly previousAnimation: SignalValue<string | undefined> = signalValue<string | undefined>(undefined);

  /**
   * Stores the previous animation playhead time during cross-fade.
   * @property {SignalValue<number>} previousAnimationTime
   * @private
   * @readonly
   */
  private readonly previousAnimationTime: SignalValue<number> = signalValue(0);

  /**
   * Stores whether the previous animation was looping during cross-fade.
   * @property {SignalValue<boolean>} previousAnimationLooping
   * @private
   * @readonly
   */
  private readonly previousAnimationLooping: SignalValue<boolean> = signalValue(false);

  /**
   * Stores total cross-fade duration in seconds.
   * @property {SignalValue<number>} blendDuration
   * @private
   * @readonly
   */
  private readonly blendDuration: SignalValue<number> = signalValue(0);

  /**
   * Stores elapsed cross-fade progress time in seconds.
   * @property {SignalValue<number>} blendTime
   * @private
   * @readonly
   */
  private readonly blendTime: SignalValue<number> = signalValue(0);

  /**
   * Derives normalized blending alpha from 0 to 1.
   * @property {ComputedValue<number>} blendAlpha
   * @private
   * @readonly
   */
  private readonly blendAlpha: ComputedValue<number>;

  /**
   * Returns the current animation name.
   * @public
   * @return {string | undefined}
   */
  public get animationName(): string | undefined {
    return this.currentAnimation();
  }

  /**
   * Returns current animation duration in seconds.
   * @public
   * @return {number}
   */
  public get duration(): number {
    return this.getAnimationDuration(this.currentAnimation());
  }

  /**
   * Returns setup skeleton height.
   * @public
   * @return {number}
   */
  public get height(): number {
    return Number(this.data.skeleton?.height ?? 1);
  }

  /**
   * Reports whether playback is active.
   * @public
   * @return {boolean}
   */
  public get isPlaying(): boolean {
    return this.animationPlaying();
  }

  /**
   * Reports whether cross-fading between animations.
   * @public
   * @return {boolean}
   */
  public get isBlending(): boolean {
    return this.blending();
  }

  /**
   * Returns current skin name.
   * @public
   * @return {string}
   */
  public get skin(): string {
    return this.activeSkin();
  }

  /**
   * Returns setup skeleton width.
   * @public
   * @return {number}
   */
  public get width(): number {
    return Number(this.data.skeleton?.width ?? 1);
  }

  /**
   * Creates a Spine runtime instance from JSON or binary skeleton buffer.
   * @public
   * @return {void}
   * @constructor
   * @param {SpineRecord | ArrayBuffer | Uint8Array<ArrayBufferLike>} dataOrBuffer The data or buffer supplied to this operation.
   * @param {Atlas} atlas The atlas supplied to this operation.
   */
  public constructor(dataOrBuffer: SpineRecord | ArrayBuffer | Uint8Array, atlas: Atlas) {
    const data: SpineRecord = (dataOrBuffer instanceof ArrayBuffer || dataOrBuffer instanceof Uint8Array)
      ? SpineBinaryParser.parse(dataOrBuffer)
      : dataOrBuffer;

    this.data = data;
    this.atlas = atlas;
    Object.entries(data.animations ?? {}).forEach(([name, animation]) => {
      this.animationDurations.set(name, this.measureDuration(animation));
    });
    const boneData: SpineRecord[] = data.bones ?? [];
    this.bones = boneData.map((bone) => ({
      data: bone,
      parentIndex: boneData.findIndex((candidate) => candidate.name === bone.parent),
      localPose: signalValue(this.identityPose()),
      pose: signalValue(this.identityPose())
    }));
    this.setupOrder = this.bones.map((_, index) => index);
    this.skins = this.normalizeSkins(data.skins);
    this.activeSkin.set(this.skins.default ? 'default' : Object.keys(this.skins)[0] ?? 'default');
    this.slotData = data.slots ?? [];
    this.slots = this.slotData.map((slot: SpineRecord) => signalValue<SpineSlotPose>({
      name: slot.name,
      boneIndex: Math.max(0, boneData.findIndex((bone) => bone.name === slot.bone)),
      attachmentName: slot.attachment ?? null,
      color: slot.color ?? 'FFFFFFFF',
      darkColor: slot.dark ?? undefined,
      blendMode: slot.blend ?? 'normal'
    }));

    this.blendAlpha = computedValue(
      () => this.blendDuration() > 0 ? MathUtils.clamp(this.blendTime() / this.blendDuration(), 0, 1) : 1,
      [this.blendTime, this.blendDuration]
    );

    const rawIk: SpineRecord[] = data.ik ?? [];
    this.ikConstraints = rawIk.map((ik) => {
      const boneList = Array.isArray(ik.bones) ? ik.bones : (ik.bone ? [ik.bone] : []);
      const boneIndices = boneList
        .map((bName: string) => boneData.findIndex((b) => b.name === bName))
        .filter((idx: number) => idx >= 0);
      return {
        name: String(ik.name),
        order: Number(ik.order ?? 0),
        boneIndices,
        targetIndex: boneData.findIndex((b) => b.name === ik.target),
        mix: Number(ik.mix ?? 1),
        softness: Number(ik.softness ?? 0),
        bendPositive: ik.bendPositive !== false,
        compress: Boolean(ik.compress),
        stretch: Boolean(ik.stretch),
        overrideTarget: signalValue<{
        /**
         * Horizontal coordinate in the owning coordinate space.
         * @property {number} x
         */
        x: number;
        /**
         * Vertical coordinate in the owning coordinate space.
         * @property {number} y
         */
        y: number } | undefined>(undefined),
        overrideMix: signalValue<number | undefined>(undefined)
      };
    });
    this.ikConstraints.sort((a, b) => a.order - b.order);

    this.evaluatePose();
  }

  /**
   * Evaluates Bézier curve interpolation progress.
   * @private
   * @return {number}
   * @param {unknown} curve The curve supplied to this operation.
   * @param {number} amount The amount supplied to this operation.
   */
  private applyCurve(curve: unknown, amount: number): number {
    if (curve === 'stepped') return 0;

    if (!Array.isArray(curve) || curve.length < 4) return amount;

    const [x1, y1, x2, y2] = curve.map(Number);
    if (![x1, y1, x2, y2].every(Number.isFinite)) return amount;
    const cubic = (t: number, first: number, second: number): number =>
      3 * (1 - t) * (1 - t) * t * first + 3 * (1 - t) * t * t * second + t * t * t;

    let low = 0;
    let high = 1;
    let parameter = amount;

    for (let iteration = 0; iteration < 12; iteration++) {
      const x = cubic(parameter, x1, x2);
      if (Math.abs(x - amount) < 1e-5) break;
      if (x < amount) low = parameter;
      else high = parameter;
      parameter = (low + high) * 0.5;
    }

    return cubic(parameter, y1, y2);
  }

  /**
   * Dispatches user animation timeline events triggered between frame timestamps.
   * @private
   * @return {void}
   * @param {string} name Name used to identify or look up this resource.
   * @param {number} from The from supplied to this operation.
   * @param {number} to The to supplied to this operation.
   */
  private emitEventsBetween(name: string, from: number, to: number): void {
    const timeline: SpineRecord[] = this.data.animations?.[name]?.events ?? [];

    timeline.forEach((key) => {
      const time = Number(key.time ?? 0);
      if (time <= from || time > to) return;
      const setup = this.data.events?.[key.name] ?? {};
      const event: SpineEvent = {
        name: key.name,
        time,
        intValue: key.int ?? setup.int,
        floatValue: key.float ?? setup.float,
        stringValue: key.string ?? setup.string,
        volume: key.volume ?? setup.volume,
        balance: key.balance ?? setup.balance,
        data: key
      };
      this.handlers.get(event.name)?.forEach((handler) => handler(event));
    });
  }

  /**
   * Computes local transform for a single bone at an animation timestamp.
   * @private
   * @return {SpineBoneTransform}
   * @param {SpineRecord} data Snapshot payload persisted by the save service.
   * @param {string | undefined} animName The anim name supplied to this operation.
   * @param {number} time The time supplied to this operation.
   */
  private evaluateLocalBonePose(data: SpineRecord, animName: string | undefined, time: number): SpineBoneTransform {
    const animation = animName ? this.data.animations?.[animName]?.bones?.[data.name] : undefined;
    const pose = this.identityPose();
    pose.rotation = Number(data.rotation ?? 0) + this.readTimeline(animation?.rotate, time, 'angle', 0);
    pose.x = Number(data.x ?? 0) + this.readTimeline(animation?.translate, time, 'x', 0);
    pose.y = Number(data.y ?? 0) + this.readTimeline(animation?.translate, time, 'y', 0);
    pose.scaleX = Number(data.scaleX ?? 1) * this.readTimeline(animation?.scale, time, 'x', 1);
    pose.scaleY = Number(data.scaleY ?? 1) * this.readTimeline(animation?.scale, time, 'y', 1);
    pose.shearX = Number(data.shearX ?? 0) + this.readTimeline(animation?.shear, time, 'x', 0);
    pose.shearY = Number(data.shearY ?? 0) + this.readTimeline(animation?.shear, time, 'y', 0);
    return pose;
  }

  /**
   * Evaluates bone forward kinematics, cross-fade blending, and slot poses.
   * @private
   * @return {void}
   */
  private evaluatePose(): void {
    const currentName = this.currentAnimation();
    const currentTime = this.animationTime();
    const isCrossFading = this.blending() && this.previousAnimation() !== undefined && this.blendDuration() > 0;
    const alpha = isCrossFading ? this.blendAlpha() : 1;
    const prevName = this.previousAnimation();
    const prevTime = this.previousAnimationTime();

    this.bones.forEach((bone) => {
      const currentPose = this.evaluateLocalBonePose(bone.data, currentName, currentTime);

      if (isCrossFading && alpha < 1 && prevName !== undefined) {
        const prevPose = this.evaluateLocalBonePose(bone.data, prevName, prevTime);
        currentPose.x = MathUtils.lerp(prevPose.x, currentPose.x, alpha);
        currentPose.y = MathUtils.lerp(prevPose.y, currentPose.y, alpha);
        currentPose.rotation = MathUtils.lerpAngle(prevPose.rotation, currentPose.rotation, alpha);
        currentPose.scaleX = MathUtils.lerp(prevPose.scaleX, currentPose.scaleX, alpha);
        currentPose.scaleY = MathUtils.lerp(prevPose.scaleY, currentPose.scaleY, alpha);
        currentPose.shearX = MathUtils.lerp(prevPose.shearX ?? 0, currentPose.shearX ?? 0, alpha);
        currentPose.shearY = MathUtils.lerp(prevPose.shearY ?? 0, currentPose.shearY ?? 0, alpha);
      }

      bone.localPose.set(currentPose);
    });

    for (const index of this.setupOrder) {
      this.updateBoneWorld(index);
    }

    this.applyIkConstraints();

    this.slots.forEach((slotValue, index) => {
      const slot = { ...slotValue() };
      const setup = this.slotData[index];
      const timeline = this.data.animations?.[this.currentAnimation() ?? '']?.slots?.[slot.name];
      const attachmentFrame = this.getFrame(timeline?.attachment, this.animationTime());
      slot.attachmentName = attachmentFrame ? (attachmentFrame.name || null) : (setup.attachment ?? null);
      slot.color = this.readColor(timeline?.rgba ?? timeline?.rgb ?? timeline?.color, this.animationTime(), setup.color ?? 'FFFFFFFF') ?? 'FFFFFFFF';
      slot.darkColor = this.readColor(timeline?.rgba2 ?? timeline?.rgb2, this.animationTime(), setup.dark);
      slot.blendMode = setup.blend ?? 'normal';
      slotValue.set(slot);
    });
  }

  /**
   * Applies 1-bone and 2-bone Inverse Kinematic constraints.
   * @private
   * @return {void}
   */
  private applyIkConstraints(): void {
    if (this.ikConstraints.length === 0) return;
    const animName = this.currentAnimation();
    const animIk = animName ? this.data.animations?.[animName]?.ik : undefined;
    const time = this.animationTime();

    for (const ik of this.ikConstraints) {
      let targetX = 0;
      let targetY = 0;
      const overrideT = ik.overrideTarget();

      if (overrideT !== undefined) {
        targetX = overrideT.x;
        targetY = overrideT.y;
      } else if (ik.targetIndex >= 0 && this.bones[ik.targetIndex]) {
        const targetPose = this.bones[ik.targetIndex].pose();
        targetX = targetPose.x;
        targetY = targetPose.y;
      } else {
        continue;
      }

      const overrideM = ik.overrideMix();
      let mix = overrideM !== undefined ? overrideM : ik.mix;
      let bendPositive = ik.bendPositive;

      if (animIk && animIk[ik.name]) {
        const frame = this.interpolateFrame(animIk[ik.name], time);
        if (frame) {
          if (frame.mix !== undefined && overrideM === undefined) mix = Number(frame.mix);
          if (frame.bendPositive !== undefined) bendPositive = frame.bendPositive !== false;
        }
      }

      if (mix <= 0) continue;

      if (ik.boneIndices.length === 1) {
        this.applyIk1(this.bones[ik.boneIndices[0]], targetX, targetY, mix);
      } else if (ik.boneIndices.length === 2) {
        this.applyIk2(this.bones[ik.boneIndices[0]], this.bones[ik.boneIndices[1]], targetX, targetY, bendPositive, mix);
      }
    }
  }

  /**
   * Solves 1-bone IK rotation toward target.
   * @private
   * @return {void}
   * @param {BoneState} bone The bone supplied to this operation.
   * @param {number} targetX The target x supplied to this operation.
   * @param {number} targetY The target y supplied to this operation.
   * @param {number} mix The mix supplied to this operation.
   */
  private applyIk1(bone: BoneState, targetX: number, targetY: number, mix: number): void {
    const pose = bone.pose();
    const radians = Math.atan2(targetY - pose.y, targetX - pose.x);
    const targetDeg = radians * MathUtils.RAD_TO_DEG;
    const currentDeg = Math.atan2(pose.c, pose.a) * MathUtils.RAD_TO_DEG;
    const local = bone.localPose();
    const diff = (targetDeg - currentDeg) % 360;
    local.rotation += diff * mix;
    bone.localPose.set(local);
    const boneIndex = this.bones.indexOf(bone);
    if (boneIndex >= 0) this.updateBoneWorld(boneIndex);
  }

  /**
   * Solves 2-bone IK using the Law of Cosines.
   * @private
   * @return {void}
   * @param {BoneState} parent Parent object used to derive the owning hierarchy or transform.
   * @param {BoneState} child The child supplied to this operation.
   * @param {number} targetX The target x supplied to this operation.
   * @param {number} targetY The target y supplied to this operation.
   * @param {boolean} bendPositive The bend positive supplied to this operation.
   * @param {number} mix The mix supplied to this operation.
   */
  private applyIk2(
    parent: BoneState,
    child: BoneState,
    targetX: number,
    targetY: number,
    bendPositive: boolean,
    mix: number
  ): void {
    const parentPose = parent.pose();
    const childPose = child.pose();

    const px = parentPose.x;
    const py = parentPose.y;
    const cx = childPose.x;
    const cy = childPose.y;

    const l1 = Math.hypot(cx - px, cy - py);
    const childLength = Number(child.data.length ?? 0) * childPose.scaleX;
    const l2 = childLength > 0 ? childLength : l1 * 0.8;

    const dx = targetX - px;
    const dy = targetY - py;
    const d = Math.hypot(dx, dy);

    if (d <= 0.0001 || l1 <= 0.0001 || l2 <= 0.0001) return;

    const c2 = MathUtils.clamp((dx * dx + dy * dy - l1 * l1 - l2 * l2) / (2 * l1 * l2), -1, 1);
    let a2 = Math.acos(c2);
    if (!bendPositive) a2 = -a2;

    const k1 = l1 + l2 * c2;
    const k2 = l2 * Math.sin(a2);
    const a1 = Math.atan2(dy, dx) - Math.atan2(k2, k1);

    const parentCurrentDeg = Math.atan2(parentPose.c, parentPose.a) * MathUtils.RAD_TO_DEG;
    const childCurrentDeg = Math.atan2(childPose.c, childPose.a) * MathUtils.RAD_TO_DEG;

    const parentTargetDeg = a1 * MathUtils.RAD_TO_DEG;
    const childTargetDeg = (a1 + a2) * MathUtils.RAD_TO_DEG;

    const parentLocal = parent.localPose();
    parentLocal.rotation = MathUtils.lerpAngle(parentLocal.rotation, parentLocal.rotation + (parentTargetDeg - parentCurrentDeg), mix);
    parent.localPose.set(parentLocal);

    const childLocal = child.localPose();
    childLocal.rotation = MathUtils.lerpAngle(childLocal.rotation, childLocal.rotation + (childTargetDeg - childCurrentDeg), mix);
    child.localPose.set(childLocal);

    const pIdx = this.bones.indexOf(parent);
    const cIdx = this.bones.indexOf(child);
    if (pIdx >= 0) this.updateBoneWorld(pIdx);
    if (cIdx >= 0) this.updateBoneWorld(cIdx);
  }

  /**
   * Retrieves duration of a registered animation.
   * @private
   * @return {number}
   * @param {string | undefined} name Name used to identify or look up this resource.
   */
  private getAnimationDuration(name: string | undefined): number {
    return name ? this.animationDurations.get(name) ?? 0 : 0;
  }

  /**
   * Resolves skin attachment by slot and attachment name.
   * @private
   * @return {SpineRecord | undefined}
   * @param {string} slotName The slot name supplied to this operation.
   * @param {string} attachmentName The attachment name supplied to this operation.
   */
  private getAttachment(slotName: string, attachmentName: string): SpineRecord | undefined {
    const skinName = this.activeSkin();
    const attachment = this.skins[skinName]?.[slotName]?.[attachmentName]
      ?? this.skins.default?.[slotName]?.[attachmentName];

    if (!attachment) return undefined;

    if (attachment.type !== 'linkedmesh' && attachment.type !== 'weightedlinkedmesh') return attachment;

    const parentSkin = String(attachment.skin ?? 'default');
    const parentName = String(attachment.parent ?? '');
    const parent = this.skins[parentSkin]?.[slotName]?.[parentName]
      ?? this.skins.default?.[slotName]?.[parentName];
    if (!parent) return undefined;

    return {
      ...parent,
      ...attachment,
      type: 'mesh',
      vertices: parent.vertices,
      bones: parent.bones,
      uvs: parent.uvs,
      triangles: parent.triangles,
      hull: parent.hull,
      path: attachment.path ?? parent.path ?? parent.name
    };
  }

  /**
   * Retrieves timeline keyframe active at given time.
   * @private
   * @return {SpineRecord | undefined}
   * @param {SpineRecord[] | undefined} frames Ordered frame regions used by the animation.
   * @param {number} time The time supplied to this operation.
   */
  private getFrame(
    frames: SpineRecord[] | undefined,
    time: number
  ): SpineRecord | undefined {
    if (!frames?.length) return undefined;
    let result: SpineRecord | undefined;
    for (const frame of frames) {
      if (Number(frame.time ?? 0) > time) break;
      result = frame;
    }
    return result ?? frames[0];
  }

  /**
   * Returns default identity transform values.
   * @private
   * @return {SpineBoneTransform}
   */
  private identityPose(): SpineBoneTransform {
    return {
      a: 1,
      b: 0,
      c: 0,
      d: 1,
      x: 0,
      y: 0,
      rotation: 0,
      scaleX: 1,
      scaleY: 1
    };
  }

  /**
   * Interpolates timeline values between consecutive keyframes.
   * @private
   * @return {SpineRecord | undefined}
   * @param {SpineRecord[] | undefined} frames Ordered frame regions used by the animation.
   * @param {number} time The time supplied to this operation.
   */
  private interpolateFrame(
    frames: SpineRecord[] | undefined,
    time: number
  ): SpineRecord | undefined {
    if (!frames?.length) return undefined;
    const { from, to, amount } = this.getTimelineSegment(frames, time);
    if (from === to || amount <= 0) return from;
    const result: SpineRecord = { ...from, time };
    for (const field of ['x', 'y', 'angle', 'scaleX', 'scaleY', 'rotateMix', 'translateMix', 'scaleMix', 'shearMix', 'mix', 'position', 'spacing']) {
      if (from[field] !== undefined || to[field] !== undefined) {
        const first = Number(from[field] ?? (field.startsWith('scale') ? 1 : 0));
        const second = Number(to[field] ?? first);
        result[field] = first + (second - first) * amount;
      }
    }
    if (from.color && to.color) result.color = this.mixHex(from.color, to.color, amount);
    for (const field of ['vertices', 'offsets']) {
      if (Array.isArray(from[field]) && Array.isArray(to[field])) {
        result[field] = from[field].map((value: number, index: number) =>
          Number(value) + (Number(to[field][index] ?? value) - Number(value)) * amount
        );
      }
    }
    return result;
  }

  /**
   * Calculates maximum duration across animation timelines.
   * @private
   * @return {number}
   * @param {unknown} animation The animation supplied to this operation.
   */
  private measureDuration(animation: unknown): number {
    let duration = 0;
    const scan = (value: unknown): void => {
      if (Array.isArray(value)) value.forEach(scan);
      else if (value && typeof value === 'object') {
        const record = value as SpineRecord;
        if (typeof record.time === 'number') duration = Math.max(duration, record.time);
        Object.values(record).forEach(scan);
      }
    };
    scan(animation);
    return duration;
  }

  /**
   * Blends two hex color strings.
   * @private
   * @return {string}
   * @param {string} from The from supplied to this operation.
   * @param {string} to The to supplied to this operation.
   * @param {number} amount The amount supplied to this operation.
   */
  private mixHex(from: string, to: string, amount: number): string {
    const normalizedFrom = from.length === 6 ? `${from}FF` : from;
    const normalizedTo = to.length === 6 ? `${to}FF` : to;

    if (
      !/^[\da-f]{8}$/i.test(normalizedFrom) || !/^[\da-f]{8}$/i.test(normalizedTo)
    ) return from;

    const channels = [0, 2, 4, 6].map((offset) => {
      const first = Number.parseInt(normalizedFrom.slice(offset, offset + 2), 16);
      const second = Number.parseInt(normalizedTo.slice(offset, offset + 2), 16);
      return Math.round(first + (second - first) * amount).toString(16).padStart(2, '0');
    });

    return channels.join('').toUpperCase();
  }

  /**
   * Normalizes skins structure.
   * @private
   * @return {Record<string, Record<string, Record<string, SpineRecord>>>}
   * @param {SpineRecord} source The source supplied to this operation.
   */
  private normalizeSkins(source: SpineRecord): Record<string, Record<string, Record<string, SpineRecord>>> {
    if (Array.isArray(source)) {
      return Object.fromEntries(source.map((skin: SpineRecord) => [skin.name, skin.attachments ?? {}]));
    }

    if (!source || typeof source !== 'object') return { default: {} };

    return source;
  }

  /**
   * Reads interpolated color timeline value.
   * @private
   * @return {string | undefined}
   * @param {SpineRecord[] | undefined} timeline The timeline supplied to this operation.
   * @param {number} time The time supplied to this operation.
   * @param {string | undefined} fallback The fallback supplied to this operation.
   */
  private readColor(
    timeline: SpineRecord[] | undefined,
    time: number,
    fallback: string | undefined
  ): string | undefined {
    const frame = this.interpolateFrame(timeline, time);
    return frame?.color ?? fallback;
  }

  /**
   * Reads interpolated numeric timeline property value.
   * @private
   * @return {number}
   * @param {SpineRecord[] | undefined} timeline The timeline supplied to this operation.
   * @param {number} time The time supplied to this operation.
   * @param {string} field The field supplied to this operation.
   * @param {number} fallback The fallback supplied to this operation.
   */
  private readTimeline(
    timeline: SpineRecord[] | undefined,
    time: number,
    field: string,
    fallback: number
  ): number {
    const frame = this.interpolateFrame(timeline, time);
    if (!frame) return fallback;
    const value = Number(frame[field]);
    if (!Number.isFinite(value)) return fallback;
    if (timeline?.[0]?.[field] !== undefined && (field === 'x' || field === 'y')) return value;
    return value;
  }

  /**
   * Locates bounding frames and interpolation ratio.
   * @private
   * @return {{ from: SpineRecord; to: SpineRecord; amount: number }}
   * @param {SpineRecord[]} frames Ordered frame regions used by the animation.
   * @param {number} time The time supplied to this operation.
   */
  private getTimelineSegment(
    frames: SpineRecord[],
    time: number
  ): {
  /**
   * From configuration or state owned by SpineRuntime.
   * @property {SpineRecord} from
   */
  from: SpineRecord;
  /**
   * To configuration or state owned by SpineRuntime.
   * @property {SpineRecord} to
   */
  to: SpineRecord;
  /**
   * Amount configuration or state owned by SpineRuntime.
   * @property {number} amount
   */
  amount: number } {
    if (time <= Number(frames[0].time ?? 0)) return {
      from: frames[0],
      to: frames[0],
      amount: 0
    };

    for (let index = 0; index < frames.length - 1; index++) {
      const from = frames[index];
      const to = frames[index + 1];
      const start = Number(from.time ?? 0);
      const end = Number(to.time ?? start);
      if (time > end) continue;
      const linear = end <= start ? 0 : MathUtils.clamp((time - start) / (end - start), 0, 1);
      return { from, to, amount: this.applyCurve(from.curve, linear) };
    }
    const last = frames.at(-1)!;
    return { from: last, to: last, amount: 0 };
  }

  /**
   * Updates world matrix transform for a bone.
   * @private
   * @return {void}
   * @param {number} index Index identifying the item within its collection.
   */
  private updateBoneWorld(index: number): void {
    const bone = this.bones[index];
    if (!bone) return;
    const { data, parentIndex } = bone;
    const localPose = bone.localPose();
    const pose = { ...localPose };
    const rotation = pose.rotation * Math.PI / 180;
    const shearX = Number(pose.shearX ?? data.shearX ?? 0) * Math.PI / 180;
    const shearY = Number(pose.shearY ?? data.shearY ?? 0) * Math.PI / 180;
    const sx = pose.scaleX;
    const sy = pose.scaleY;
    const la = Math.cos(rotation + shearX) * sx;
    const lc = Math.sin(rotation + shearX) * sx;
    const lb = -Math.sin(rotation - shearY) * sy;
    const ld = Math.cos(rotation - shearY) * sy;
    if (parentIndex < 0) {
      pose.a = la; pose.b = lb; pose.c = lc; pose.d = ld;
      bone.pose.set(pose);
      return;
    }
    const parent = this.bones[parentIndex]?.pose();
    if (!parent) return;
    const x = localPose.x; const y = localPose.y;
    pose.x = parent.a * x + parent.b * y + parent.x;
    pose.y = parent.c * x + parent.d * y + parent.y;
    pose.a = parent.a * la + parent.b * lc;
    pose.b = parent.a * lb + parent.b * ld;
    pose.c = parent.c * la + parent.d * lc;
    pose.d = parent.c * lb + parent.d * ld;
    bone.pose.set(pose);
  }

  /**
   * Sets the active skin.
   * @public
   * @return {void}
   * @param {string} name Name used to identify or look up this resource.
   */
  public setSkin(name: string): void {
    if (!this.skins[name]) throw new Error(`Spine skin "${name}" does not exist.`);
    this.activeSkin.set(name);
    this.evaluatePose();
  }

  /**
   * Plays an animation with optional loop and cross-fade blending duration.
   * @public
   * @return {void}
   * @param {string} name Name used to identify or look up this resource.
   * @param {boolean} [loop] Whether playback repeats after reaching the final frame.
   * @param {number} [blendDuration] The blend duration supplied to this operation.
   */
  public play(name: string, loop = false, blendDuration = 0): void {
    if (!this.data.animations?.[name]) throw new Error(`Spine animation "${name}" does not exist.`);

    if (blendDuration > 0 && this.animationPlaying() && this.currentAnimation()) {
      this.previousAnimation.set(this.currentAnimation());
      this.previousAnimationTime.set(this.animationTime());
      this.previousAnimationLooping.set(this.animationLooping());
      this.blendDuration.set(blendDuration);
      this.blendTime.set(0);
      this.blending.set(true);
    } else {
      this.blending.set(false);
      this.previousAnimation.set(undefined);
    }

    this.currentAnimation.set(name);
    this.animationTime.set(0);
    this.animationPlaying.set(true);
    this.animationLooping.set(loop);
    this.queuedAnimation.set(undefined);
    this.evaluatePose();
    this.emitEventsBetween(name, -Number.EPSILON, 0);
  }

  /**
   * Cross-fades to a new animation over the specified duration.
   * @public
   * @return {void}
   * @param {string} name Name used to identify or look up this resource.
   * @param {number} duration The duration supplied to this operation.
   * @param {boolean} [loop] Whether playback repeats after reaching the final frame.
   */
  public crossFade(name: string, duration: number, loop = false): void {
    this.play(name, loop, duration);
  }

  /**
   * Sets an interactive world-space IK target.
   * @public
   * @return {void}
   * @param {string} constraintName The constraint name supplied to this operation.
   * @param {number} worldX The world x supplied to this operation.
   * @param {number} worldY The world y supplied to this operation.
   * @param {number} [mix] The mix supplied to this operation.
   */
  public setIkTarget(constraintName: string, worldX: number, worldY: number, mix = 1.0): void {
    const ik = this.ikConstraints.find((c) => c.name === constraintName);
    if (ik) {
      ik.overrideTarget.set({ x: worldX, y: worldY });
      ik.overrideMix.set(mix);
      this.evaluatePose();
    }
  }

  /**
   * Clears an interactive IK target override.
   * @public
   * @return {void}
   * @param {string} constraintName The constraint name supplied to this operation.
   */
  public clearIkTarget(constraintName: string): void {
    const ik = this.ikConstraints.find((c) => c.name === constraintName);
    if (ik) {
      ik.overrideTarget.set(undefined);
      ik.overrideMix.set(undefined);
      this.evaluatePose();
    }
  }

  /**
   * Queues an animation to play following current animation completion.
   * @public
   * @return {void}
   * @param {string} name Name used to identify or look up this resource.
   * @param {boolean} [loop] Whether playback repeats after reaching the final frame.
   */
  public queue(name: string, loop = true): void {
    if (!this.data.animations?.[name]) throw new Error(`Spine animation "${name}" does not exist.`);
    this.queuedAnimation.set(name);
    this.queuedLooping.set(loop);
  }

  /**
   * Advances simulation frame.
   * @public
   * @return {void}
   * @param {number} deltaSeconds Elapsed simulation time in seconds.
   */
  public update(deltaSeconds: number): void {
    if (!this.animationPlaying() || deltaSeconds <= 0) return;
    this.updateBlend(deltaSeconds);
    const name = this.currentAnimation();
    if (!name) return;
    this.advanceAnimation(name, deltaSeconds);
    this.evaluatePose();
    this.startQueuedAnimation();
  }

  /**
   * Advances cross-fade timing and the previous animation playhead.
   * @private
   * @param {number} deltaSeconds Duration of the frame in seconds.
   * @return {void}
   */
  /**
   * Advances cross-fade timing and the previous animation playhead.
   * @private
   * @param {number} deltaSeconds Duration of the frame in seconds.
   * @return {void}
   */
  private updateBlend(deltaSeconds: number): void {
    if (!this.blending()) return;
    const nextBlend = this.blendTime() + deltaSeconds;
    this.blendTime.set(nextBlend);
    if (nextBlend >= this.blendDuration()) {
      this.blending.set(false);
      this.previousAnimation.set(undefined);
      return;
    }
    const previousName = this.previousAnimation();
    if (!previousName) return;
    const duration = this.getAnimationDuration(previousName);
    let nextTime = this.previousAnimationTime() + deltaSeconds;
    if (duration > 0 && nextTime >= duration && this.previousAnimationLooping()) {
      nextTime %= duration;
    }
    this.previousAnimationTime.set(nextTime);
  }

  /**
   * Advances the active playhead and emits events crossed during this frame.
   * @private
   * @param {string} name Active animation name.
   * @param {number} deltaSeconds Duration of the frame in seconds.
   * @return {void}
   */
  /**
   * Advances the active playhead and emits events crossed during this frame.
   * @private
   * @param {string} name Active animation name.
   * @param {number} deltaSeconds Duration of the frame in seconds.
   * @return {void}
   */
  private advanceAnimation(name: string, deltaSeconds: number): void {
    const duration = this.getAnimationDuration(name);
    const previous = this.animationTime();
    const next = previous + deltaSeconds;
    if (duration <= 0 || next < duration) {
      this.emitEventsBetween(name, previous, next);
      this.animationTime.set(next);
      return;
    }
    if (!this.animationLooping()) {
      this.emitEventsBetween(name, previous, duration);
      this.animationTime.set(duration);
      this.animationPlaying.set(false);
      return;
    }
    this.advanceLoopingAnimation(name, previous, next, duration);
  }

  /**
   * Wraps a looping playhead while emitting events for each crossed cycle.
   * @private
   * @param {string} name Active animation name.
   * @param {number} previous Previous animation time.
   * @param {number} next Unwrapped animation time.
   * @param {number} duration Animation duration.
   * @return {void}
   */
  /**
   * Wraps a looping playhead while emitting events for each crossed cycle.
   * @private
   * @param {string} name Active animation name.
   * @param {number} previous Previous animation time.
   * @param {number} next Unwrapped animation time.
   * @param {number} duration Animation duration.
   * @return {void}
   */
  private advanceLoopingAnimation(name: string, previous: number, next: number, duration: number): void {
    this.emitEventsBetween(name, previous, duration);
    const overflow = next - duration;
    const completeLoops = Math.floor(overflow / duration);
    for (let loop = 0; loop < completeLoops; loop++) {
      this.emitEventsBetween(name, -Number.EPSILON, duration);
    }
    const wrappedTime = overflow % duration;
    this.emitEventsBetween(name, -Number.EPSILON, wrappedTime);
    this.animationTime.set(wrappedTime);
  }

  /**
   * Starts and evaluates the queued animation after a non-looping clip ends.
   * @private
   * @return {void}
   */
  /**
   * Starts and evaluates the queued animation after a non-looping clip ends.
   * @private
   * @return {void}
   */
  private startQueuedAnimation(): void {
    if (!this.animationPlaying() && this.queuedAnimation()) {
      const queued = this.queuedAnimation();
      this.currentAnimation.set(queued);
      this.animationTime.set(0);
      this.animationPlaying.set(true);
      this.animationLooping.set(this.queuedLooping());
      this.queuedAnimation.set(undefined);
      this.evaluatePose();
    }
  }

  /**
   * Subscribes a listener to custom animation timeline events.
   * @public
   * @return {() => void}
   * @param {string} name Name used to identify or look up this resource.
   * @param {SpineEventHandler} handler The handler supplied to this operation.
   */
  public onEvent(name: string, handler: SpineEventHandler): () => void {
    const handlers = this.handlers.get(name) ?? new Set<SpineEventHandler>();
    handlers.add(handler);
    this.handlers.set(name, handlers);
    return () => {
      handlers.delete(handler);
      if (handlers.size === 0) this.handlers.delete(name);
    };
  }

  /**
   * Returns drawables in draw order.
   * @public
   * @return {Array<{ slot: SpineSlotPose; bone: SpineBoneTransform; attachment: SpineRecord }>}
   */
  public getDrawables(): Array<{
  /**
   * Save slot identifying the snapshot within a game.
   * @property {SpineSlotPose} slot
   */
  slot: SpineSlotPose;
  /**
   * Bone configuration or state owned by SpineRuntime.
   * @property {SpineBoneTransform} bone
   */
  bone: SpineBoneTransform;
  /**
   * Attachment configuration or state owned by SpineRuntime.
   * @property {SpineRecord} attachment
   */
  attachment: SpineRecord }> {
    const animation = this.data.animations?.[this.currentAnimation() ?? ''];
    const drawOrder = animation?.draworder ?? animation?.drawOrder;
    let orderedSlots = this.slots.map((slot) => slot());
    const drawFrame = this.getFrame(drawOrder, this.animationTime());
    if (drawFrame?.offsets?.length) {
      const setupSlots = this.slots.map((slot) => slot());
      const orderedIndices = new Array<number>(setupSlots.length).fill(-1);
      const unchangedIndices = new Array<number>(setupSlots.length - drawFrame.offsets.length);
      let originalIndex = 0;
      let unchangedIndex = 0;
      drawFrame.offsets.forEach((offset: SpineRecord) => {
        const slotIndex = setupSlots.findIndex((slot) => slot.name === offset.slot);
        if (slotIndex < originalIndex || slotIndex < 0) return;
        while (originalIndex < slotIndex) {
          unchangedIndices[unchangedIndex++] = originalIndex++;
        }
        const targetIndex = originalIndex + Number(offset.offset ?? 0);
        if (targetIndex >= 0 && targetIndex < orderedIndices.length) orderedIndices[targetIndex] = originalIndex;
        originalIndex++;
      });
      while (originalIndex < setupSlots.length) {
        unchangedIndices[unchangedIndex++] = originalIndex++;
      }
      for (let index = orderedIndices.length - 1; index >= 0; index--) {
        if (orderedIndices[index] < 0) orderedIndices[index] = unchangedIndices[--unchangedIndex];
      }
      orderedSlots = orderedIndices.map((index) => setupSlots[index]);
    }
    return orderedSlots.flatMap((slot) => {
      const attachmentName = slot.attachmentName;
      const attachment = attachmentName ? this.getAttachment(slot.name, attachmentName) : undefined;
      return attachment ? [{ slot, bone: this.getBonePose(slot.boneIndex), attachment }] : [];
    });
  }

  /**
   * Calculates animated mesh deformations.
   * @public
   * @return {number[]}
   * @param {string} slotName The slot name supplied to this operation.
   * @param {string} attachmentName The attachment name supplied to this operation.
   * @param {number[]} source The source supplied to this operation.
   */
  public getAttachmentVertices(slotName: string, attachmentName: string, source: number[]): number[] {
    const name = this.currentAnimation();
    if (!name) return source;
    const animation = this.data.animations?.[name];
    const deformSet = animation?.deform?.[this.activeSkin()]?.[slotName]?.[attachmentName]
      ?? animation?.deform?.default?.[slotName]?.[attachmentName]
      ?? animation?.ffd?.[this.activeSkin()]?.[slotName]?.[attachmentName]
      ?? animation?.ffd?.default?.[slotName]?.[attachmentName];
    if (!deformSet?.length) return source;
    const output = [...source];
    const time = this.animationTime();
    const { from, to, amount } = this.getTimelineSegment(deformSet, time);
    const fromOffset = Math.max(0, Number(from.offset ?? 0));
    const toOffset = Math.max(0, Number(to.offset ?? 0));
    const fromValues: number[] = from.vertices ?? [];
    const toValues: number[] = to.vertices ?? [];
    for (let index = 0; index < output.length; index++) {
      const first = index >= fromOffset && index < fromOffset + fromValues.length
        ? Number(fromValues[index - fromOffset] ?? 0) : 0;
      const second = index >= toOffset && index < toOffset + toValues.length
        ? Number(toValues[index - toOffset] ?? 0) : 0;
      output[index] += first + (second - first) * amount;
    }
    return output;
  }

  /**
   * Retrieves world transform matrix for a bone index.
   * @public
   * @return {SpineBoneTransform}
   * @param {number} index Index identifying the item within its collection.
   */
  public getBonePose(index: number): SpineBoneTransform {
    return this.bones[index]?.pose() ?? this.identityPose();
  }

  /**
   * Retrieves world transform matrix for a bone name.
   * @public
   * @return {SpineBoneTransform | undefined}
   * @param {string} name Name used to identify or look up this resource.
   */
  public getBoneByName(name: string): SpineBoneTransform | undefined {
    const bone = this.bones.find((b) => b.data.name === name);
    return bone ? bone.pose() : undefined;
  }
}
