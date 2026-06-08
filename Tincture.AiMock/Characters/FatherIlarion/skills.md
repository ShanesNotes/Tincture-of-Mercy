# father_ilarion

## offer_seat
preconds: kalev_present
targets: kalev
effects: kalev.pressure -= 0.05; scene.tempo := slowed
animation: ilarion_gesture_to_bench

## share_bread
preconds: self.has_bread; kalev.burden < 0.9
targets: kalev
effects: kalev.numbness -= 0.03
cost: self.bread_count -= 1
animation: ilarion_breaks_bread

## keep_silence
preconds:
targets: kalev
effects: scene.silence_held := true
animation: ilarion_stills

## name_in_book
preconds: kalev.notebook_open
targets: kalev.notebook
arguments: name:string
effects: notebook.append := {name}; kalev.burden += 0.02
animation: ilarion_dictates

## point_to_path
preconds: scene.location == wayhouse_porch_bethany
targets: kalev
arguments: destination:enum[bethany_proper,north_road,monastery]
effects: kalev.compass_hint := {destination}
animation: ilarion_points

## refuse_request
preconds: kalev_just_asked
targets: kalev
effects: scene.tension += 0.05; self.disposition_to_kalev -= 0.02
animation: ilarion_shakes_head

## bless_for_road
preconds: kalev.about_to_leave; self.disposition_to_kalev > 0
targets: kalev
effects: kalev.steady += 0.10; kalev.spirit += 0.05
cost: self.spirit -= 0.10
animation: ilarion_signs_cross
