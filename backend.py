from flask import Flask, request, jsonify, abort, send_file, redirect, url_for,render_template
import orarend

app = Flask(__name__)

tt = orarend.TimeTable()
tt.loadTableFromFile("data/9e.json")


## Delete a period's lessons endpoint
@app.route('/api/deleteLesson', methods=['DELETE'])
def del_lesson():
	print(request.form["day"])
	tt.delLessons(request.form["day"], request.form["period"]); 
	tt.saveTable(); 
	return ("",200)

## Update selected lesson endpoint
@app.route('/api/setLesson', methods=['POST'])
def set_lesson():
	try:
		tt.setLesson(request.form["day"], request.form["period"], request.form["lesson"],
			tt.createLesson(
				request.form["subject"],
				request.form["room"],
				request.form["teacher"],
				request.form["group"],
				"lunch" in request.form
			)
		)
		tt.saveTable(); 
	except Exception as e:
		return (e.message, 406)
	return get_index()

## Teacher acronym dict endpoint
@app.route('/api/namings', methods=['GET'])
def get_teachers():
	return send_file("data/namings.json")

## Timetable endpoint
@app.route('/api/timetable', methods=['GET'])
def get_timetable():
	data = tt.getFullTable();
	if data == {}:
		abort(500)
	return jsonify(data)

@app.route('/', methods=['GET'])
def get_index():
	return redirect('/static/orarend_testlayout.html')

## Start HTTP backend server
if __name__ == '__main__':
	print("Starting HTTP server")
	app.run(debug=True)
