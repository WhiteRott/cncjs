// AXIS
export const AXIS_E = 'e';
export const AXIS_X = 'x';
export const AXIS_Y = 'y';
export const AXIS_Z = 'z';
export const AXIS_A = 'a';
export const AXIS_B = 'b';
export const AXIS_C = 'c';

// Imperial System
export const IMPERIAL_UNITS = 'in';
export const IMPERIAL_STEPS = [
  0.0001,
  0.0002,
  0.0003,
  0.0005,
  0.001,
  0.002,
  0.003,
  0.005,
  0.01,
  0.02,
  0.03,
  0.05,
  0.1,
  0.2,
  0.3,
  0.5,
  1, // Default
  2,
  3,
  5,
  10,
  20
];

// Metric System
export const METRIC_UNITS = 'mm';
export const METRIC_STEPS = [
  0.001,
  0.002,
  0.003,
  0.005,
  0.01,
  0.02,
  0.03,
  0.05,
  0.1,
  0.2,
  0.3,
  0.5,
  1, // Default
  2,
  3,
  5,
  10,
  20,
  30,
  50,
  100,
  200,
  300,
  500
];

// Controller
export const GRBL = 'Grbl';
export const MARLIN = 'Marlin';
export const SMOOTHIE = 'Smoothie';
export const TINYG = 'TinyG';

// Workflow State
export const WORKFLOW_STATE_IDLE = 'idle';
export const WORKFLOW_STATE_PAUSED = 'paused';
export const WORKFLOW_STATE_RUNNING = 'running';

// Grbl Active State
export const GRBL_ACTIVE_STATE_IDLE = 'Idle';
export const GRBL_ACTIVE_STATE_RUN = 'Run';
export const GRBL_ACTIVE_STATE_HOLD = 'Hold';
export const GRBL_ACTIVE_STATE_DOOR = 'Door';
export const GRBL_ACTIVE_STATE_HOME = 'Home';
export const GRBL_ACTIVE_STATE_SLEEP = 'Sleep';
export const GRBL_ACTIVE_STATE_ALARM = 'Alarm';
export const GRBL_ACTIVE_STATE_CHECK = 'Check';

// Smoothie Active State
export const SMOOTHIE_ACTIVE_STATE_IDLE = 'Idle';
export const SMOOTHIE_ACTIVE_STATE_RUN = 'Run';
export const SMOOTHIE_ACTIVE_STATE_HOLD = 'Hold';
export const SMOOTHIE_ACTIVE_STATE_DOOR = 'Door';
export const SMOOTHIE_ACTIVE_STATE_HOME = 'Home';
export const SMOOTHIE_ACTIVE_STATE_ALARM = 'Alarm';
export const SMOOTHIE_ACTIVE_STATE_CHECK = 'Check';

// TinyG Machine State
// https://github.com/synthetos/g2/wiki/Status-Reports#stat-values
export const TINYG_MACHINE_STATE_INITIALIZING = 0; // Machine is initializing
export const TINYG_MACHINE_STATE_READY = 1; // Machine is ready for use
export const TINYG_MACHINE_STATE_ALARM = 2; // Machine is in alarm state
export const TINYG_MACHINE_STATE_STOP = 3; // Machine has encountered program stop
export const TINYG_MACHINE_STATE_END = 4; // Machine has encountered program end
export const TINYG_MACHINE_STATE_RUN = 5; // Machine is running
export const TINYG_MACHINE_STATE_HOLD = 6; // Machine is holding
export const TINYG_MACHINE_STATE_PROBE = 7; // Machine is in probing operation
export const TINYG_MACHINE_STATE_CYCLE = 8; // Reserved for canned cycles (not used)
export const TINYG_MACHINE_STATE_HOMING = 9; // Machine is in a homing cycle
export const TINYG_MACHINE_STATE_JOG = 10; // Machine is in a jogging cycle
export const TINYG_MACHINE_STATE_INTERLOCK = 11; // Machine is in safety interlock hold
export const TINYG_MACHINE_STATE_SHUTDOWN = 12; // Machine is in shutdown state. Will not process commands
export const TINYG_MACHINE_STATE_PANIC = 13; // Machine is in panic state. Needs to be physically reset

// Tool Shape Types
// Naming follows FreeCAD's CAM workbench tool bit shape taxonomy
// (src/Mod/CAM/Tools/Shape/shape_aliases.json), for consistent terminology.
export const TOOL_SHAPE_ENDMILL = 'endmill';
export const TOOL_SHAPE_BALLEND = 'ballend';
export const TOOL_SHAPE_BULLNOSE = 'bullnose';
export const TOOL_SHAPE_CHAMFER = 'chamfer';
export const TOOL_SHAPE_VBIT = 'vbit';
export const TOOL_SHAPE_TAPERED_BALLNOSE = 'taperballnose';
export const TOOL_SHAPE_DRILL = 'drill';
export const TOOL_SHAPE_REAMER = 'reamer';
export const TOOL_SHAPE_DOVETAIL = 'dovetail';
export const TOOL_SHAPE_RADIUS = 'radius';
export const TOOL_SHAPE_TAP = 'tap';
export const TOOL_SHAPE_THREAD_MILL = 'threadmill';
export const TOOL_SHAPE_SLITTING_SAW = 'slittingsaw';
export const TOOL_SHAPE_PROBE = 'probe';
export const TOOL_SHAPE_CUSTOM = 'custom';

export const TOOL_SHAPES = [
  { value: TOOL_SHAPE_ENDMILL, label: 'Endmill' },
  { value: TOOL_SHAPE_BALLEND, label: 'Ball End' },
  { value: TOOL_SHAPE_BULLNOSE, label: 'Bullnose' },
  { value: TOOL_SHAPE_CHAMFER, label: 'Chamfer' },
  { value: TOOL_SHAPE_VBIT, label: 'V-Bit' },
  { value: TOOL_SHAPE_TAPERED_BALLNOSE, label: 'Tapered Ball Nose' },
  { value: TOOL_SHAPE_DRILL, label: 'Drill' },
  { value: TOOL_SHAPE_REAMER, label: 'Reamer' },
  { value: TOOL_SHAPE_DOVETAIL, label: 'Dovetail' },
  { value: TOOL_SHAPE_RADIUS, label: 'Radius' },
  { value: TOOL_SHAPE_TAP, label: 'Tap' },
  { value: TOOL_SHAPE_THREAD_MILL, label: 'Thread Mill' },
  { value: TOOL_SHAPE_SLITTING_SAW, label: 'Slitting Saw' },
  { value: TOOL_SHAPE_PROBE, label: 'Probe' },
  { value: TOOL_SHAPE_CUSTOM, label: 'Custom' },
];
