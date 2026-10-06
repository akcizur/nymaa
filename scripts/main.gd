extends Node3D

const WORLD_SIZE := 100.0
const ENTER_RANGE := 4.2

const BUILDING_TYPES := {
	"HOUSE": {"size": Vector3(10, 4, 10), "color": Color(0.56, 0.40, 0.31)},
	"OFFICE": {"size": Vector3(12, 12, 12), "color": Color(0.40, 0.44, 0.51)},
	"SHOP": {"size": Vector3(14, 5, 10), "color": Color(0.64, 0.54, 0.30)},
	"WAREHOUSE": {"size": Vector3(20, 6, 14), "color": Color(0.46, 0.49, 0.53)},
	"BLOCK": {"size": Vector3(16, 20, 16), "color": Color(0.32, 0.36, 0.42)}
}

const LAYOUT := [
	["OFFICE", -10, -6],
	["SHOP", 8, -8],
	["HOUSE", -12, 8],
	["OFFICE", 10, 8],
	["HOUSE", -38, -35],
	["WAREHOUSE", 0, -35],
	["SHOP", 37, -35],
	["OFFICE", -38, 35],
	["BLOCK", -8, 35],
	["SHOP", 10, 35],
	["HOUSE", 37, 35],
	["HOUSE", -37, 0],
	["OFFICE", 37, 0]
]

@onready var roads_root: Node3D = $Roads
@onready var buildings_root: Node3D = $Buildings
@onready var player = $Player
@onready var vehicle = $Vehicle
@onready var touch_controls = $TouchControls

var driving := false
var state_label: Label
var prompt_label: Label

func _ready() -> void:
	_spawn_roads()
	_spawn_buildings()
	_spawn_vehicle_details()

	player.global_position = Vector3(0, 0, -20)
	vehicle.global_position = Vector3(6, 0, -20)

	touch_controls.move_vector_changed.connect(_on_touch_vector_changed)
	touch_controls.action_pressed.connect(_toggle_vehicle)

	_build_hud()

	if DisplayServer.is_touchscreen_available():
		$DirectionalLight3D.shadow_enabled = false

	_update_hud()

func _process(_delta: float) -> void:
	_update_hud()

func _spawn_roads() -> void:
	var road_mat := StandardMaterial3D.new()
	road_mat.albedo_color = Color(0.085, 0.095, 0.11)
	road_mat.roughness = 1.0

	_add_road(Vector2(WORLD_SIZE, 10), Vector3(0, 0.02, -20), road_mat)
	_add_road(Vector2(WORLD_SIZE, 10), Vector3(0, 0.02, 20), road_mat)
	_add_road(Vector2(10, WORLD_SIZE), Vector3(-25, 0.024, 0), road_mat)
	_add_road(Vector2(10, WORLD_SIZE), Vector3(25, 0.024, 0), road_mat)

func _add_road(size: Vector2, pos: Vector3, material: Material) -> void:
	var mi := MeshInstance3D.new()
	var mesh := PlaneMesh.new()
	mesh.size = size
	mi.mesh = mesh
	mi.material_override = material
	mi.position = pos
	roads_root.add_child(mi)

func _spawn_buildings() -> void:
	for entry in LAYOUT:
		_add_building(String(entry[0]), Vector3(float(entry[1]), 0, float(entry[2])))

func _add_building(type_key: String, pos: Vector3) -> void:
	var data: Dictionary = BUILDING_TYPES[type_key]
	var size: Vector3 = data["size"]
	var color: Color = data["color"]

	var body := StaticBody3D.new()
	body.position = pos + Vector3(0, size.y * 0.5, 0)
	body.collision_layer = 1
	body.collision_mask = 1

	var mi := MeshInstance3D.new()
	var mesh := BoxMesh.new()
	mesh.size = size
	mi.mesh = mesh

	var mat := StandardMaterial3D.new()
	mat.albedo_color = color
	mat.roughness = 0.92
	mi.material_override = mat
	body.add_child(mi)

	var cs := CollisionShape3D.new()
	var shape := BoxShape3D.new()
	shape.size = size
	cs.shape = shape
	body.add_child(cs)

	buildings_root.add_child(body)

func _spawn_vehicle_details() -> void:
	var cabin_mesh := BoxMesh.new()
	cabin_mesh.size = Vector3(1.7, 0.62, 2.0)
	var cabin_mat := StandardMaterial3D.new()
	cabin_mat.albedo_color = Color(0.13, 0.16, 0.20)
	cabin_mat.roughness = 0.75
	$Vehicle/Cabin.mesh = cabin_mesh
	$Vehicle/Cabin.material_override = cabin_mat

	var wheel_mat := StandardMaterial3D.new()
	wheel_mat.albedo_color = Color(0.05, 0.06, 0.07)
	wheel_mat.roughness = 1.0

	for pair in [
		["WheelFL", Vector3(-1.02, 0.42, 1.45)],
		["WheelFR", Vector3(1.02, 0.42, 1.45)],
		["WheelRL", Vector3(-1.02, 0.42, -1.45)],
		["WheelRR", Vector3(1.02, 0.42, -1.45)]
	]:
		var wheel := MeshInstance3D.new()
		wheel.name = String(pair[0])

		var wheel_mesh := CylinderMesh.new()
		wheel_mesh.top_radius = 0.42
		wheel_mesh.bottom_radius = 0.42
		wheel_mesh.height = 0.32
		wheel_mesh.radial_segments = 12

		wheel.position = pair[1]
		wheel.mesh = wheel_mesh
		wheel.material_override = wheel_mat
		wheel.rotation.z = PI * 0.5
		$Vehicle/Wheels.add_child(wheel)

	var lamp_mesh := BoxMesh.new()
	lamp_mesh.size = Vector3(0.36, 0.18, 0.10)
	var lamp_mat := StandardMaterial3D.new()
	lamp_mat.albedo_color = Color(1.0, 0.88, 0.58)

	for x in [-0.62, 0.62]:
		var lamp := MeshInstance3D.new()
		lamp.position = Vector3(x, 0.82, 2.21)
		lamp.mesh = lamp_mesh
		lamp.material_override = lamp_mat
		$Vehicle.add_child(lamp)

func _on_touch_vector_changed(value: Vector2) -> void:
	player.touch_vector = value
	vehicle.touch_vector = value

func _toggle_vehicle() -> void:
	if not driving:
		if player.global_position.distance_to(vehicle.global_position) > ENTER_RANGE:
			return

		driving = true
		player.visible = false
		player.input_locked = true
		player.collision_layer = 0
		player.collision_mask = 0
		player.global_position = vehicle.global_position
		vehicle.controlled = true
	else:
		driving = false
		player.visible = true
		player.input_locked = false
		player.collision_layer = 1
		player.collision_mask = 1
		vehicle.controlled = false

		var right := Vector3(cos(vehicle.rotation.y), 0, -sin(vehicle.rotation.y))
		player.global_position = vehicle.global_position + right * 2.4
		player.global_position.y = 0.0

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("enter_car"):
		_toggle_vehicle()

func _build_hud() -> void:
	var layer := CanvasLayer.new()
	layer.layer = 20
	add_child(layer)

	var panel := ColorRect.new()
	panel.position = Vector2(14, 14)
	panel.size = Vector2(240, 90)
	panel.color = Color(0.035, 0.045, 0.055, 0.86)
	panel.mouse_filter = Control.MOUSE_FILTER_IGNORE
	layer.add_child(panel)

	var title := Label.new()
	title.position = Vector2(12, 8)
	title.text = "NYMAA / CITY BLOCKOUT"
	title.add_theme_font_size_override("font_size", 12)
	title.add_theme_color_override("font_color", Color.WHITE)
	panel.add_child(title)

	state_label = Label.new()
	state_label.position = Vector2(12, 35)
	state_label.add_theme_font_size_override("font_size", 11)
	panel.add_child(state_label)

	var controls := Label.new()
	controls.position = Vector2(12, 58)
	controls.text = "WASD / ARROWS   •   E"
	controls.add_theme_font_size_override("font_size", 9)
	controls.add_theme_color_override("font_color", Color(0.55, 0.6, 0.65))
	panel.add_child(controls)

	prompt_label = Label.new()
	prompt_label.position = Vector2(0, 104)
	prompt_label.size = Vector2(300, 34)
	prompt_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	prompt_label.add_theme_font_size_override("font_size", 12)
	prompt_label.add_theme_color_override("font_color", Color.WHITE)
	prompt_label.set_anchors_and_offsets_preset(Control.PRESET_CENTER_TOP)
	layer.add_child(prompt_label)

func _update_hud() -> void:
	if state_label == null:
		return

	if driving:
		state_label.text = "MODE        DRIVING"
		state_label.add_theme_color_override("font_color", Color(1.0, 0.82, 0.46))
		prompt_label.text = "E / TOUCH  •  EXIT CAR"
		touch_controls.action_enabled = true
		touch_controls.queue_redraw()
		prompt_label.visible = true
	else:
		state_label.text = "MODE        ON FOOT"
		state_label.add_theme_color_override("font_color", Color(0.82, 0.87, 0.92))
		var near := player.global_position.distance_to(vehicle.global_position) <= ENTER_RANGE
		prompt_label.text = "E / TOUCH  •  ENTER CAR" if near else ""
		touch_controls.action_enabled = near
		touch_controls.queue_redraw()
		prompt_label.visible = near
