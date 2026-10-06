extends Control

signal move_vector_changed(value: Vector2)
signal action_pressed

var joystick_center := Vector2.ZERO
var joystick_radius := 56.0
var knob_radius := 25.0
var action_center := Vector2.ZERO
var action_radius := 38.0

var active_touch_id := -1
var move_vector := Vector2.ZERO
var action_enabled := false:
	set(value):
		field = value
		queue_redraw()

func _ready() -> void:
	set_process_input(true)
	visible = DisplayServer.is_touchscreen_available()
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	queue_redraw()

func _notification(what: int) -> void:
	if what == NOTIFICATION_RESIZED:
		queue_redraw()

func _draw() -> void:
	if not visible:
		return

	var scale := clamp(min(size.x, size.y) / 720.0, 0.82, 1.18)
	joystick_radius = 56.0 * scale
	knob_radius = 25.0 * scale
	action_radius = 38.0 * scale

	joystick_center = Vector2(92.0 * scale, size.y - 100.0 * scale)
	action_center = Vector2(size.x - 84.0 * scale, size.y - 92.0 * scale)

	draw_circle(joystick_center, joystick_radius, Color(0.03, 0.04, 0.05, 0.46))
	draw_arc(joystick_center, joystick_radius, 0.0, TAU, 64, Color(1, 1, 1, 0.17), 1.2)
	draw_circle(joystick_center + move_vector * joystick_radius * 0.64, knob_radius, Color(1, 1, 1, 0.12))
	draw_arc(joystick_center + move_vector * joystick_radius * 0.64, knob_radius, 0.0, TAU, 48, Color(1, 1, 1, 0.28), 1.0)

	if action_enabled:
		draw_circle(action_center, action_radius, Color(0.03, 0.04, 0.05, 0.55))
		draw_arc(action_center, action_radius, 0.0, TAU, 48, Color(1, 1, 1, 0.2), 1.2)

		var font := ThemeDB.fallback_font
	draw_string(font, action_center + Vector2(-8, 6), "E", HORIZONTAL_ALIGNMENT_LEFT, -1, 18, Color.WHITE)

func _input(event: InputEvent) -> void:
	if not visible:
		return

	if event is InputEventScreenTouch:
		var touch := event as InputEventScreenTouch
		if touch.pressed:
			if touch.position.distance_to(joystick_center) <= joystick_radius * 1.45 and active_touch_id == -1:
				active_touch_id = touch.index
				_update_joystick(touch.position)
			elif action_enabled and touch.position.distance_to(action_center) <= action_radius * 1.5:
				action_pressed.emit()
		elif touch.index == active_touch_id:
			active_touch_id = -1
			move_vector = Vector2.ZERO
			move_vector_changed.emit(move_vector)
			queue_redraw()

	elif event is InputEventScreenDrag:
		var drag := event as InputEventScreenDrag
		if drag.index == active_touch_id:
			_update_joystick(drag.position)

func _update_joystick(position: Vector2) -> void:
	var delta := position - joystick_center
	if delta.length() > joystick_radius:
		delta = delta.normalized() * joystick_radius

	move_vector = delta / joystick_radius
	move_vector_changed.emit(move_vector)
	queue_redraw()
