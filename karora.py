import requests, json 

TIMETABLE_URL = 'https://admin.karinthy.hu/api/substitutions'

request = json.loads(requests.get(TIMETABLE_URL).text)['substitutions']

print(json.dumps(request,indent=2))
