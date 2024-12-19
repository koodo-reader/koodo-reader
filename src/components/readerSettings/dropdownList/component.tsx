// import React from "react";
// import { dropdownList } from "../../../constants/dropdownList";
// import "./dropdownList.css";
// import { Trans } from "react-i18next";
// import { DropdownListProps, DropdownListState } from "./interface";
// import StorageUtil from "../../../utils/serviceUtils/storageUtil";

// class DropdownList extends React.Component<DropdownListProps, DropdownListState> {
//   constructor(props: DropdownListProps) {
//     super(props);
//     this.state = {
//       currentFontFamilyIndex: dropdownList[0].option.findIndex((item: any) => {
//         return (
//           item ===
//           (StorageUtil.getReaderConfig("fontFamily") || "Built-in font")
//         );
//       }),
//       currentLineHeightIndex: dropdownList[1].option.findIndex((item: any) => {
//         return (
//           item === (StorageUtil.getReaderConfig("lineHeight") || "Default")
//         );
//       }),
//       currentTextAlignIndex: dropdownList[2].option.findIndex((item: any) => {
//         return item === (StorageUtil.getReaderConfig("textAlign") || "Default");
//       }),
//     };
//   }

//   componentDidMount() {
//     this.loadGoogleFonts(["Arial", "Verdana"]);
//   }

//   loadGoogleFonts(fonts: string[]) {
//     const googleFontLink = document.createElement("link");
//     googleFontLink.rel = "stylesheet";
//     googleFontLink.href = `https://fonts.googleapis.com/css2?family=${fonts
//       .map((font) => font.replace(" ", "+"))
//       .join("&family=")}&display=swap`;
//     document.head.appendChild(googleFontLink);

//     // Ajouter les polices à la liste des options
//     dropdownList[0].option = ["Arial", ...fonts];
//     this.setState({
//       currentFontFamilyIndex: dropdownList[0].option.findIndex(
//         (item: any) =>
//           item === (StorageUtil.getReaderConfig("fontFamily") || "Arial")
//       ),
//     });
//   }

//   handleView(event: any, option: string) {
//     let arr = event.target.value.split(",");
//     StorageUtil.setReaderConfig(option, arr[0]);
//     switch (option) {
//       case "fontFamily":
//         this.setState({
//           currentFontFamilyIndex: parseInt(arr[1]),
//         });
//         document.body.style.fontFamily =
//           arr[0] === "Built-in font" ? "" : arr[0];
//         break;
//         case "lineHeight":
//           this.setState({
//             currentLineHeightIndex: arr[1],
//           });
  
//           break;
//       case "textAlign":
//         this.setState({
//           currentTextAlignIndex: parseInt(arr[1]),
//         });
//         break;
//       default:
//         break;
//     }
//     this.props.renderBookFunc();
//   }

//   render() {
//     const renderParagraphCharacter = () => {
//       return dropdownList.map((item) => (
//         <li className="paragraph-character-container" key={item.id}>
//           <p className="general-setting-title">
//             <Trans>{item.title}</Trans>
//           </p>
//           <select
//             name=""
//             className="general-setting-dropdown"
//             value={
//               item.value === "lineHeight"
//                     ? this.state.currentLineHeightIndex
//                     : item.value === "textAlign"
//                     ? this.state.currentTextAlignIndex
//                     : this.state.currentFontFamilyIndex
//             }
//             onChange={(event) => {
//               this.handleView(event, item.value);
//             }}
//           >
//             {item.option.map((subItem: string, index: number) => (
//               <option
//                 value={[subItem, index.toString()]}
//                 key={index}
//                 className="general-setting-option"
//               >
//                 {this.props.t(subItem)}
//               </option>
//             ))}
//           </select>
//         </li>
//       ));
//     };

//     return (
//       <ul className="paragraph-character-setting">
//         {renderParagraphCharacter()}
//       </ul>
//     );
//   }
// }

// export default DropdownList;
