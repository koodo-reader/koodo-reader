// import localforage from "localforage";
const initState = {
  isBackup: false
};
export function backupPage(state = initState, action) {
  switch (action.type) {
    case "HANDLE_BACKUP":
      return {
        ...state,
        isBackup: action.payload
      };

    default:
      return state;
  }
}

export function handleBackup(mode) {
  return { type: "HANDLE_BACKUP", payload: mode };
}

// export function handleFetchLocations(epub) {
//   return dispatch => {
//     console.log(epub);
//     if (epub.locations !== undefined) {
//       epub.locations.generate().then(result => {
//         let locations = epub.locations;
//         console.log("sfhafshfhafh");
//         dispatch(handleLocations(locations));
//       });
//     }
//   };
// }
