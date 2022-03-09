let usersRef = db.collection('Users');
let deleteIDs = [];

// REAL TIME LISTENER
usersRef.onSnapshot(snapshot => {
	let changes = snapshot.docChanges();
	changes.forEach(change => {
		if (change.type == 'added') {
			console.log('added');
		} else if (change.type == 'modified') {
			console.log('modified');
		} else if (change.type == 'removed') {
			$('tr[data-id=' + change.doc.id + ']').remove();
			console.log('removed');
		}
	});
});

// GET TOTAL SIZE
usersRef.onSnapshot(snapshot => {
	let size = snapshot.size;
	$('.count').text(size);
	if (size == 0) {
		$('#selectAll').attr('disabled', true);
	} else {
		$('#selectAll').attr('disabled', false);
	}
});


 const displayUsers = async (doc) => {
    console.log('displayUsers');

    let users = usersRef;

    let usersBusinessOwner = users.where("usertype", "!=", "Administrator");
    // .startAfter(doc || 0).limit(10000)
    const data = await usersBusinessOwner.get();

    data.docs.forEach(doc => {
        const usersBusinessOwner = doc.data();
        var usertype = usersBusinessOwner.usertype;
		var userstatus = usersBusinessOwner.status;

        // display user status
        if(usertype == 'Businessowner') {
        	var display = 'Business Owner';
        } else if(usertype == 'Customer') {
        	var display = 'Customer';
        }

        // display verification status
		if(userstatus == "active") {
			var display_status = '<span class="status-p bg-success">Active</span>';
		} else if(userstatus == "inactive") {
			var display_status = '<span class="status-p bg-danger">Inactive</span>';			
		} else {
			var display_status = '<span class="status-p bg-success">Active</span>';					
		}


        let item =
            `<tr data-id="${doc.id}">
                    <td class="users-name">${usersBusinessOwner.fullname}</td>
                    <td class="users-email">${usersBusinessOwner.email}</td>
                    <td class="users-role">${display}</td>
                    <td class="users-status">${display_status}</td>
            </tr>`;


			// let item =
        //     `<tr data-id="${doc.id}">
        //             <td class="users-name">${usersBusinessOwner.fullname}</td>
        //             <td class="users-email">${usersBusinessOwner.email}</td>
        //             <td class="users-phonenumber">${usersBusinessOwner.phoneNumber}</td>
        //             <td class="users-role">${display}</td>
        //             <td class="users-status"><span class="status-p bg-danger">Not Verified</span></td>
        //     </tr>`;


        $('#users-table').append(item);
    });

    // UPDATE LATEST DOC
    latestDoc = data.docs[data.docs.length - 1];

}

// addTestData();

$(document).ready(function () {

	let latestDoc = null;

	// LOAD INITIAL DATA
	displayUsers();

	// LOAD MORE
	$(document).on('click', '.js-loadmore', function () {
		displayUsers(latestDoc);
	});

	// ADD EMPLOYEE
	$("#add-accounts-form").submit(function (event) {
		event.preventDefault();
		let employeeName = $('#employee-name').val();
		let employeeEmail = $('#employee-email').val();
		let employeeAddress = $('#employee-address').val();
		let employeePhone =  $('#employee-phone').val();
		db.collection('employees').add({
			name: employeeName,
			email: employeeEmail,
			address: employeeAddress,
			phone: employeePhone,
			createdAt : firebase.firestore.FieldValue.serverTimestamp()
			}).then(function (docRef) {
				console.log("Document written with ID: ", docRef.id);
				$("#addEmployeeModal").modal('hide');

				let newEmployee =
				`<tr data-id="${docRef.id}">
						<td>
								<span class="custom-checkbox">
										<input type="checkbox" id="${docRef.id}" name="options[]" value="${docRef.id}">
										<label for="${docRef.id}"></label>
								</span>
						</td>
						<td class="employee-name">${employeeName}</td>
						<td class="employee-email">${employeeEmail}</td>
						<td class="employee-address">${employeeAddress}</td>
						<td class="employee-phone">${employeePhone}</td>
						<td>
								<a href="#" id="${docRef.id}" class="edit js-edit-employee"><i class="material-icons" data-toggle="tooltip" title="Edit">&#xE254;</i>
								</a>
								<a href="#" id="${docRef.id}" class="delete js-delete-employee"><i class="material-icons" data-toggle="tooltip" title="Delete">&#xE872;</i>
								</a>
						</td>
				</tr>`;

			$('#employee-table tbody').prepend(newEmployee);
			})
			.catch(function (error) {
				console.error("Error writing document: ", error);
			});
	});

	// UPDATE EMPLOYEE
	$(document).on('click', '.js-edit-employee', function (e) {
		e.preventDefault();
		let id = $(this).attr('id');
		$('#edit-employee-form').attr('edit-id', id);
		db.collection('employees').doc(id).get().then(function (document) {
			if (document.exists) {
				$('#edit-employee-form #employee-name').val(document.data().name);
				$('#edit-employee-form #employee-email').val(document.data().email);
				$('#edit-employee-form #employee-address').val(document.data().address);
				$('#edit-employee-form #employee-phone').val(document.data().phone);
				$('#editEmployeeModal').modal('show');
			} else {
				console.log("No such document!");
			}
		}).catch(function (error) {
			console.log("Error getting document:", error);
		});
	});

	$("#edit-employee-form").submit(function (event) {
		event.preventDefault();
		let id = $(this).attr('edit-id');
		let employeeName = $('#edit-employee-form #employee-name').val();
		let employeeEmail = $('#edit-employee-form #employee-email').val();
		let employeeAddress = $('#edit-employee-form #employee-address').val();
		let employeePhone =  $('#edit-employee-form  #employee-phone').val();

		db.collection('employees').doc(id).update({
			name: employeeName,
			email: employeeEmail,
			address: employeeAddress,
			phone: employeePhone,
			updatedAt : firebase.firestore.FieldValue.serverTimestamp()
		});

		$('#editEmployeeModal').modal('hide');

		// SHOW UPDATED DATA ON BROWSER
		$('tr[data-id=' + id + '] td.employee-name').html(employeeName);
		$('tr[data-id=' + id + '] td.employee-email').html(employeeEmail);
		$('tr[data-id=' + id + '] td.employee-address').html(employeeAddress);
		$('tr[data-id=' + id + '] td.employee-phone').html(employeePhone);
	});

	// DELETE EMPLOYEE
	$(document).on('click', '.js-delete-employee', function (e) {
		e.preventDefault();
		let id = $(this).attr('id');
		$('#delete-employee-form').attr('delete-id', id);
		$('#deleteEmployeeModal').modal('show');
	});

	$("#delete-employee-form").submit(function (event) {
		event.preventDefault();
		let id = $(this).attr('delete-id');
		if (id != undefined) {
			db.collection('employees').doc(id).delete()
				.then(function () {
					console.log("Document successfully delete!");
					$("#deleteEmployeeModal").modal('hide');
				})
				.catch(function (error) {
					console.error("Error deleting document: ", error);
				});
		} else {
			let checkbox = $('table tbody input:checked');
			checkbox.each(function () {
				db.collection('employees').doc(this.value).delete()
					.then(function () {
						console.log("Document successfully delete!");
						displayEmployees();
					})
					.catch(function (error) {
						console.error("Error deleting document: ", error);
					});
			});
			$("#deleteEmployeeModal").modal('hide');
		}
	});

	// SEARCH
	$("#search-name").keyup(function () {
		$('#employee-table tbody').html('');
		let nameKeyword = $("#search-name").val();
		console.log(nameKeyword);
		accountsRef.orderBy('name', 'asc').startAt(nameKeyword).endAt(nameKeyword + "\uf8ff").get()
			.then(function (documentSnapshots) {
				documentSnapshots.docs.forEach(doc => {
					renderEmployee(doc);
				});
			});
	});

	// RESET FORMS
	$("#addEmployeeModal").on('hidden.bs.modal', function () {
		$('#add-employee-form .form-control').val('');
	});

	$("#editEmployeeModal").on('hidden.bs.modal', function () {
		$('#edit-employee-form .form-control').val('');
	});
});

// CENTER MODAL
(function ($) {
	"use strict";

	function centerModal() {
		$(this).css('display', 'block');
		var $dialog = $(this).find(".modal-dialog"),
			offset = ($(window).height() - $dialog.height()) / 2,
			bottomMargin = parseInt($dialog.css('marginBottom'), 10);

		// Make sure you don't hide the top part of the modal w/ a negative margin if it's longer than the screen height, and keep the margin equal to the bottom margin of the modal
		if (offset < bottomMargin) offset = bottomMargin;
		$dialog.css("margin-top", offset);
	}

	$(document).on('show.bs.modal', '.modal', centerModal);
	$(window).on("resize", function () {
		$('.modal:visible').each(centerModal);
	});
}(jQuery));