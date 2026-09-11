export const INITIAL_STATE = {
  userId: JSON.parse(localStorage.getItem("currentUser"))?._id,
  title: "",
  cat: "",
  cover: "",
  images: [],
  desc: "",
  shortTitle: "",
  shortDesc: "",
  deliveryTime: 0,
  revisionNumber: 0,
  features: [],
  price: 0,
  verificationDocs: [],
};

export const serviceReducer = (state, action) => {
  switch (action.type) {
    case "CHANGE_INPUT":
      return {
        ...state,
        [action.payload.name]: action.payload.value,
      };
    case "ADD_FEATURE":
      return {
        ...state,
        features: [...state.features, action.payload],
      };
    case "ADD_IMAGES":
      return {
        ...state,
        cover: action.payload.cover,
        images: action.payload.images,
      };
    case "ADD_VERIFICATION_DOCS":
      return {
        ...state,
        verificationDocs: action.payload,
      };
    case "REMOVE_FEATURE":
      return {
        ...state,
        features: state.features.filter(
          (feature) => feature !== action.payload
        ),
      };

    default:
      return state;
  }
};
