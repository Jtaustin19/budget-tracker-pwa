let db;
const request = indexedDB.open('budget_tracker', 1);

request.onupgradeneeded = function (e) {
    const db = e.target.result;
    db.createObjectStore('new_transaction', { autoIncrement: true });
};

request.onsuccess = function (e) {
    db = e.target.result;
    if (navigator.onLine) {
        console.log('Navigator online');
        uploadTransaction();
    }
};

request.onerror = function (e) {
    console.log(e.target.errorCode);
};

//  Start Callback Function 

function saveRecord(record) {
    const transaction = db.transaction(['new_transaction'], 'readwrite');
    const budgetObjectStore = transaction.objectStore('new_transaction');
    budgetObjectStore.add(record);
    alert('You are now offline.\nBudget Tracker will submit all offline activity to the database once internet connection is restored.\nOffline access is still available.')
};

function uploadTransaction() {
    const transaction = db.transaction(['new_transaction'], 'readwrite');
    const budgetObjectStore = transaction.objectStore('new_transaction');
    const getAll = budgetObjectStore.getAll();

    getAll.onsuccess = function() {
        if (getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
                .then(response => response.json())
                .then(serverResponse => {
                    if (serverResponse.message) throw new Error(serverResponse);

                    const transaction = db.transaction(['new_transaction'], 'readwrite');
                    const budgetObjectStore = transaction.objectStore('new_transaction');
                    
                    budgetObjectStore.clear();
                    alert('All offline activity has been submitted!')
                })
                .catch(err => console.log(err));
        }
    };
};

// End Callback Function

window.addEventListener('online', uploadTransaction);