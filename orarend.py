import json

## TERMINOLOGY
##
## period: idő szerinti tanóra (0. 1. ... 8.)
## lesson: tanár által leadott óra (több lehet egy periodban pl. csoportbontáskor)
## subject:	tantárgy, terv szerint mindegyiknek lesz egy int kódja
## groupcode: <int 0-10> az adott lesson csoportkódja, többféle bontásban pl (info/média)


class TimeTable:
	
	## Stores the timetable from JSON file 
	table = {}
	filePath = ""	

	## Read the timetable JSON and parse to 'table' variable
	def loadTableFromFile(self, path):
		try:
			with open(path, "r") as f:
				self.table = json.loads(f.read())
				print("Parsed TimeTable from:",path)
		except Exception as e:
			print("[TT] Failed to read TimeTable:",e)
		self.filePath = path
	
	## Save 'table' variable to file
	def saveTable(self):
		with open(self.filePath, "w") as f:
			json.dump(self.table, f)
			print("Wrote TimeTable to:",self.filePath)

	## Return whole timetable dictionary
	def getFullTable(self):
		return self.table

	## Gets all Lessons from a Period
	def getLessons(self, day, period):
		return self.table[day]["periods"][period]

	## Set given list of lessons to the specified period
	def setLesson(self, day, period, lessonNum, lesson):
		# If new lesson, create the array
		if self.table[day]["periods"][int(period)] == []:
			self.table[day]["periods"][int(period)] = [lesson]
		else:
			self.table[day]["periods"][int(period)][int(lessonNum)] = lesson
		print(f"Updated lessons at {day}:{period}")

	## Delete all lessons in a period 
	def delLessons(self, day, period):
		self.table[day]["periods"][int(period)] = []
		print(f"Deleted all lessons at {day}:{period}")



	## Create a lesson object (for modifying the table)
	def createLesson(self,subject,room,teacher,groupCode,lunch):
		lesson = {
			"subject": subject,
			"room": room,
			"teacher": teacher,
			"groupcode": groupCode,
			"lunch": lunch
		}
		return lesson
	
