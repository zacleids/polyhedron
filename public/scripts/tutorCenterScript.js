var $body = $('body');

var $studentTable = $('#studentTable');
var $requestTable = $('#requestsTable');
var $tutorsTable = $('#tutorsTable');

var $contextMenuStudent = $('#studentContextMenu');
var $contextMenuRequest = $('#requestContextMenu');
var $contextMenuTutor = $('#tutorContextMenu');

var tableData = '';
var actionSelected = '';

var currentStudentIdExists = false;

// Student Table Context Menu ***********************************
// display the menu at the cursor position
$body.on('contextmenu', '#studentTable tbody tr', function (e) {
    // hide the other context menus
    $contextMenuRequest.hide();
    $contextMenuTutor.hide();

    // get which row they clicked on
    tableData = $(this).attr('data-id');

    // display this context menu
    $contextMenuStudent.css({
        display: 'block',
        left: e.pageX - $studentTable.offset().left + 15, //magic numbers
        top: e.pageY - $studentTable.offset().top + 20 //magic numbers
    });
    return false;
});

// hide the menu when you click a link in menu
$contextMenuStudent.on('click', 'a', function () {
    actionSelected = $(this).attr('data-action');
    switch(actionSelected){
        case 'request':
            $('#reqStudentID').attr('value', tableData);
            $('#tutorRequestModal').modal();
            break;
        case 'studentSignOut':
            studentSignOut(tableData);
            break;
        case 'changeLocation':
            $('#CLStudentID').attr('value', tableData);
            $('#changeLocationModal').modal();
            break;
        case 'changeSubject':
            $('#CSubStudentID').attr('value', tableData);
            getClasses(tableData, 'selectNewSubject');
            $('#changeSubjectModal').modal();
            break;
        default:
            alert('Student: ' + tableData + '. Action: ' + actionSelected);
            break;
    }
    $contextMenuStudent.hide();
});

// Request Table Context Menu ***********************************
// display the menu at the cursor position
$body.on('contextmenu', '#requestsTable tbody tr', function (e) {
    // hide the other context menus
    $contextMenuStudent.hide();
    $contextMenuTutor.hide();

    // get which row they clicked on
    tableData = $(this).attr('data-id');

    // display this context menu
    $contextMenuRequest.css({
        display: 'block',
        left: e.pageX - $requestTable.offset().left + 15, //magic numbers
        top: e.pageY - $requestTable.offset().top + 20 //magic numbers
    });
    return false;
});

// hide the menu when you click a link in menu
$contextMenuRequest.on('click', 'a', function () {
    actionSelected = $(this).attr('data-action');
    switch (actionSelected) {
        case 'beginTutoring':
            $('#BTRequestID').attr('value', tableData);
            $('#beginTutoringModal').modal();
            break;
        case 'finishTutoring':
            deleteRequest(tableData);
            break;
        case 'deleteRequest':
            deleteRequest(tableData);
            break;
    }
    $contextMenuRequest.hide();
});

// Tutor Table Context Menu ***********************************
// display the menu at the cursor position
$body.on('contextmenu', '#tutorsTable tbody tr', function (e) {
    // hide the other context menus
    $contextMenuStudent.hide();
    $contextMenuRequest.hide();

    // get which row they clicked on
    tableData = $(this).attr('data-id');

    // display this context menu
    $contextMenuTutor.css({
        display: 'block',
        left: e.pageX - $tutorsTable.offset().left + 15, //magic numbers
        top: e.pageY - $tutorsTable.offset().top + 20 //magic numbers
    });
    return false;
});

// hide the menu when you click a link in menu
$contextMenuTutor.on('click', 'a', function () {
    actionSelected = $(this).attr("data-action");
    switch(actionSelected){
        case 'clockOut':
            tutorSignOut(tableData);
            break;
        default:
            alert('Tutor: ' + tableData + '. Action: ' + actionSelected);
            break;
    }
    $contextMenuTutor.hide();
});

// hide the menu on click anywhere else
$body.click(function () {
    $contextMenuStudent.hide();
    $contextMenuRequest.hide();
    $contextMenuTutor.hide();
});

function toggleAbleToSignIn() {
    var classSelected = $('#selectSubject').val() !== '#';
    var locationSelected = $('#selectLocation').val() !== '#';

    var $signInButton = $('#studentSignInSubmit');

    userExists($('#signInStudentID').val(), function(doesExist){
        if (doesExist && locationSelected && classSelected) {
            //enable sign in
            $signInButton.prop('disabled', false);
        } else {
            $signInButton.prop('disabled', true);
        }

    });

}

function unpopulateClasses() {
    var $selectSubject = $('#selectSubject');
    $selectSubject.empty();
    $selectSubject.html("<option value='#'>-Select Subject-</option>");
}

function changeInputOutline(color) {
    var $signInStudentId = $('#signInStudentID');
    var boxShadow = 'inset 0 1px 1px ' + color + ', 0 0 5px ' + color + '';
    if(color === '') boxShadow = '';

    $signInStudentId.css('border-color', color);
    $signInStudentId.css('box-shadow', boxShadow);
}

function handleStudent(){
    var $signInStudentId = $('#signInStudentID');
    var $signInButton = $('#studentSignInSubmit');

    if ($signInStudentId.val().length >= 4) {
        userExists($signInStudentId.val(), function(exists){
            currentStudentIdExists = exists;
            if (exists === true) {
                getClasses($signInStudentId.val(), 'selectSubject');
                //make text outline green
                changeInputOutline('lightgreen');
            }
            else {
                $signInButton.prop('disabled', true);
                //make text outline red
                changeInputOutline('orangered');
                unpopulateClasses()
            }
        });
    } else if ($signInStudentId.val().length < 4) {
        $signInButton.prop('disabled', true);
        //make text outline default
        changeInputOutline('');
        unpopulateClasses()
    } else {
        $signInButton.prop('disabled', true);
        //make text outline red
        changeInputOutline('orangered');
        unpopulateClasses()
    }
}

$(document).ready(function() {
    // upon changing the value of the ID input
    $('#signInStudentID').on('input', function () {
        handleStudent();
    });

    // upon changing the value of the location selector
    $('#selectLocation').on('change', function () {
        toggleAbleToSignIn();
    });

    // upon changing the value of the class selector
    $('#selectSubject').on('change', function () {
        toggleAbleToSignIn();
    });
});



// redraw student table upon student sign in
function refreshStudentTable(students) {
    var $studentTableBody = $('#studentTable tbody');
    // empty the table
    $studentTableBody.html('');

    // re-draw the table
    var name = '';
    var course = '';
    var location = '';
    for (var row = 0; row < students.length; row++) {
        name = students[row].name;
        course = students[row].course;
        location = students[row].location;

        var rowData = '<tr data-id="' + students[row].id + '">';
        rowData += ('<td>' + name + '</td>');
        rowData += ('<td>' + course + '</td>');
        rowData += ('<td>' + location + '</td>');
        rowData += '</tr>';

        $studentTableBody.append(rowData);
    }
}



// redraw student table upon student sign in
function refreshRequestsTable(requests) {
    var $requestTableBody = $('#requestsTable tbody');
    // empty the table
    $requestTableBody.html('');

    // re-draw the table
    var name = '';
    var course = '';
    var location = '';
    var waitTime = '';
    var request = '';
    var tutor = '';

    for (var row = 0; row < requests.length; row++) {
        name = requests[row].requestingStudent;
        course = requests[row].requestedCourse;
        location = requests[row].requestedLocation;
        waitTime = requests[row].requestTime;
        request = requests[row].requestedTutor;
        if (requests[row].assignedTutor) {
            tutor = requests[row].assignedTutor;
        } else {
            tutor = '';
        }
        var rowData = '<tr data-id="' + requests[row].id + '"  style="background-color:' + requests[row].color + '">';
        rowData += ('<td>' + name + '</td>');
        rowData += ('<td>' + course + '</td>');
        rowData += ('<td>' + location + '</td>');
        rowData += ('<td>' + waitTime + '</td>');
        rowData += ('<td>' + request + '</td>');
        rowData += ('<td>' + tutor + '</td>');
        rowData += '</tr>';

        $requestTableBody.append(rowData);
    }
}

// redraw student table upon student sign in
function refreshTutorsTable(tutors) {
    var $tutorTableBody = $('#tutorsTable tbody');

    // empty the table
    $tutorTableBody.html('');

    // re-draw the table
    var name = '';
    var loginTime = '';
    for (var row = 0; row < tutors.length; row++) {
        name = tutors[row].name;
        loginTime = tutors[row].loginTime;

        var rowData = '<tr data-id="' + tutors[row].id + '">';
        rowData += ('<td>' + name + '</td>');
        rowData += ('<td>' + loginTime + '</td>');
        rowData += '</tr>';

        $tutorTableBody.append(rowData);
    }

    function refreshTutorsList(tutors){
        var $selectTutor = $('#selectTutor');
        var $selectTutor2 = $('#selectTutor2');
        $selectTutor.empty();
        $selectTutor2.empty();
        for (var i = 0; i < tutors.length; i++) {
            $selectTutor.append("<option value='" + tutors[i].id + "'>" + tutors[i].name + '</option>');
            $selectTutor2.append("<option value='" + tutors[i].id + "'>" + tutors[i].name + '</option>');
        }
    }
}