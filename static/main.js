// GLOBAL VARIABLES 
let selectedLessonDiv = null;
let namings = null;
const templates = document.getElementById("lessonTemplates");



// PURPOSE: Make reloading the table on editor actions work
// CALLER:  onLoadPage for first load, and editor actions: add, edit, delete
// ACTION:  Remove previous table if there was, fetch updated table and issue a regeneration
// TODO: handle open/close of editor pane & selected lesson !!! 
function loadTimeTable(reload) {
	
	const ttDiv = document.getElementById("timeTableDiv"); 
	
	// On reload,
	if (reload) {
		// Close pane 
		document.querySelector(".editorSidepane").classList.remove("open");
		document.getElementById("timeTable").classList.remove("pushleft");
		
		// Remove old table (temporary solution)
		ttDiv.innerHTML = "";
		console.log("Removed old TimeTable for reloading")
	}
	
	// Create new Table and add it to the div
	let table = templates.content.querySelector("#timeTable").cloneNode(true);
	ttDiv.appendChild(table);
	
	// Fetch new table data
	fetch("http://localhost:5000/api/timetable")
	.then( response => response.json())
	.then( json=> generateTable(json, table))
	.catch(error => {
		console.error('Error fetching table:', error);
		document.getElementById("title").innerHTML = "☕ Valami újra fos ☕"; 
	});
}




// PURPOSE: Funcionality of the delete lesson button
// CALLER:  Called when delete button is pressed in lesson editor
// ACTION:  Sends HTTP DELETE query to backend, then reloads the timetable
function onDelLesson() {
	const form = document.getElementById("editorForm");
	const formData = {
		day: form.querySelector("#day").value,
		period: form.querySelector("#period").value
	};
	const params = new URLSearchParams(formData).toString();
	const apiURL = "/api/deleteLesson";
	
	// Send the DELETE request
	fetch(`${apiURL}`, {
		method: 'DELETE',
		headers: {'Content-Type': 'application/x-www-form-urlencoded'},
		body: params
	}).catch((error) => {
		console.error('Error:', error);
	}).then( loadTimeTable(true) );
}



// PURPOSE: Used when an acronym gets converted back to full name
// CALLER:  When you click on a lesson and the form fields get autofilled
// ACTION:  Searches an dictionary and returns the key based on the value
function getKey(obj, value) {
	for (const key in obj) 
		if (obj[key] === value) 
			return key;
	return undefined; // Value not found in the object
}




// PURPOSE: Handle when you create a new lesson from on empty period 
// CALLER:  When you click an empty period
// ACTION:  Replace empty lesson div with normal lesson div, and call onClickLesson to select it
function onClickEmptyLesson(clickedDiv) {
	const day = clickedDiv.getAttribute("data-day");
	const period = clickedDiv.getAttribute("data-period");
	
	parentNode = clickedDiv.parentNode;
	clickedDiv.remove();
	
	let div = templates.content.querySelector(".lessonDiv.normal").cloneNode(true);
	div.setAttribute("data-day", day);
	div.setAttribute("data-period", period);
	div.setAttribute("data-lesson", 0);
	parentNode.appendChild(div);
	onClickLesson(div);
}




// PURPOSE: Make the clicked lesson selected (visually and inside the form)
// CALLER:  When you click on an existing lesson div
// ACTION:  Make lesson selected/ in css, unselect previous lesson, 
//			open/close editor pane, autofill fields in editor form,
//			or make lesson unselected if clicked again
function onClickLesson(clickedDiv) {
	// Unselect previous (if there is previous)
	if (selectedLessonDiv != null) selectedLessonDiv.classList.remove("selected");
	
	// Unselect current if clicked again and close panel
	if (selectedLessonDiv == clickedDiv) {
		
		clickedDiv.classList.remove("selected");
		selectedLessonDiv = null;
		
		// Close pane
		document.querySelector(".editorSidepane").classList.remove("open");
		document.getElementById("timeTable").classList.remove("pushleft");
		return;
	}
	
	// Select the new one
	selectedLessonDiv = clickedDiv;
	selectedLessonDiv.classList.add("selected");
	
	// Open editor pane
	document.querySelector(".editorSidepane").classList.add("open");
	document.getElementById("timeTable").classList.add("pushleft");
	
	
	const form = document.getElementById("editorForm");
	
	// Get day+period form the selected div to fill the form
	const day = selectedLessonDiv.getAttribute("data-day");
	const period = selectedLessonDiv.getAttribute("data-period");
	const lessonNum = selectedLessonDiv.getAttribute("data-lesson");
	// Fill in the location of the selected div into the form
	form.querySelector("#day").value = day;
	form.querySelector("#period").value = period;
	form.querySelector("#lesson").value = lessonNum;
	
	// Set values of the fields of the form the selected div
	form.querySelector("#teacher").value = selectedLessonDiv.querySelector(".teacher").textContent.slice(-3);
	form.querySelector("#room").value = selectedLessonDiv.querySelector(".room").textContent;
	form.querySelector("#group").value = getKey(namings["groups"],selectedLessonDiv.querySelector(".groupname").textContent);
	form.querySelector("#subject").value = getKey(namings["subjects"],selectedLessonDiv.querySelector(".lessontitle").textContent);
	form.querySelector("#lunch").checked = selectedLessonDiv.querySelector(".lunchbar"); 
	// group and subject get converted back from their real name to acronym with getKey()
	
	// Generate pane title string (i.e. "Hétfő 2. óra")
	dayLocale = {
		"monday": "Hétfő",
		"tuesday": "Kedd",
		"wednesday": "Szerda",
		"thursday": "Csütörtök",
		"friday": "Péntek"
	}
	document.getElementById("editorSubTitle").textContent = dayLocale[day] + " " + period + ". óra";
	document.getElementById("editorSubTitle2").textContent = "lesson #" + lessonNum; 
}




// PURPOSE: Generate the dropdown menu items in the editor from "namings"
// CALLER:  when page is loaded (in theory) 
// ACTION:  Iterate through the fields of "namings" and add them as options
function fillFormSelectFields() {
	const names = {
		"subject": "subjects",
		"teacher": "teachers",
		"group": "groups"
	};
	let menu;
	for (const [menuName, entryName] of Object.entries(names)) {
		menu = document.getElementById("editorForm").querySelector("#"+menuName);
		for (const acronym in namings[entryName]) {
			const option = document.createElement("option");
			option.value = acronym; 
			option.text = namings[entryName][acronym]; 
			menu.appendChild(option);
		}
	}
}




// PURPOSE: Initial function, starts the loading of the page
// CALLER:  when page is loaded
// ACTION:  Fetches the jsons from backend, then generates table and fills the menus in the form
function onLoadPage() {
	const urls = [ 
		"http://localhost:5000/api/namings",
	];
	const fetchPromises = urls.map(url => fetch(url).then(response => response.json()));

	Promise.all(fetchPromises)
	.then( jsonResponses => 
	{
		namings = jsonResponses[0];
		fillFormSelectFields();
		loadTimeTable(false);
	})
	.catch(error => {
		console.error('Error fetching table:', error);
		document.getElementById("title").innerHTML = "☕ Valami fos ☕"; 
	});
	// do not write code here bcause of async bullshit
}



			
// mini-function, replaces 'undefined' with '?' for better looks when generating the table
function isundef(val) {
	return val==undefined ? "?" : val;
	//this line has no purpose other than to allow vim to fold this function xdd
}

// PURPOSE: Create one lesson div from given lesson object
// CALLER:  generateTable() calls on every lesson to be created 
// ACTION:  copies the HTML template of the type of lesson and sets its fields from the object given
function constructLessonDiv(lesson, day, period, lessonNum) {
	// Default lesson template is normal
	let className = "normal";

	// If there is no lesson, use 'nolesson' template // currently unused?
	if (!lesson) className="nolesson";

	// Copy the selected lesson template div
	let div = templates.content.querySelector(".lessonDiv."+className).cloneNode(true);
	div.setAttribute("data-day", day);
	div.setAttribute("data-period", period);
	div.setAttribute("data-lesson", lessonNum);

	if (lesson) {
		div.querySelector(".lessonTitle").innerHTML = isundef(namings["subjects"][lesson["subject"]]);
		div.querySelector(".room").innerHTML = isundef(lesson["room"]);
		// Sketchy way of adding the on-hover span for teacher names
		div.querySelector(".teacher").innerHTML = 
			"<span class=\"teacher-tooltip\">"+ namings["teachers"][lesson["teacher"]] +"</span>"+ isundef(lesson["teacher"]);
		div.querySelector(".groupName").innerHTML = isundef(namings["groups"][lesson["groupcode"]]);

		// Add lunchbar div if there is lunch
		if (lesson["lunch"]) {
			let lb = document.createElement("div");
			lb.classList.add("lunchbar");
			div.appendChild(lb);
		}
	}
	return div;
}




// PURPOSE: Generates the whole HTML for the table from the fetched data
// CALLER:  onLoadPage() calls after fetching the table 
function generateTable(fetchedTable, table) {
	console.log(fetchedTable);
	// Sets the page's title to the class of the fetched table
	document.getElementById("title").innerHTML = fetchedTable["class"].toUpperCase();
	
	// Used for accessing the days in the fetched json
	const days = ["monday","tuesday","wednesday","thursday","friday"];
	
	
	// Main generation loop
	// Note: this loops horizontally through the table, so each row first
	for (let period = 0; period < 8; period++) {

		// Create new row
		const row = document.createElement("tr");
		table.appendChild(row);
		
		// Add the lesson number as the header of the row
		const cell = document.createElement("th");
		cell.textContent = period;
		cell.classList.add("rowHeader");
		row.appendChild(cell);
		
		for (let day = 0; day < 5; day++) {
			const lessons = fetchedTable[days[day]]["periods"][period];
		
			// Create and append a cell to the row
			const cell = document.createElement("td");
			row.appendChild(cell);

			// Create the main div "period" and add it to the cell
			// All lessons go within this div
			const periodDiv = document.createElement("div");
			periodDiv.classList.add("period");
			cell.appendChild(periodDiv);

			// Generate div of each lesson objects in the period
			// And append them to the period div
			if (lessons.length === 0)
				periodDiv.appendChild(constructLessonDiv(undefined, days[day], period, -1));

			// Generate all lessons in the period (with given number IDs)
			let lessonNum = 0;
			for (const lesson of lessons) {
				periodDiv.appendChild(constructLessonDiv(lesson, days[day], period, lessonNum));
				lessonNum++;
			}
		}
	}
	table.classList.remove("hidden");
}
