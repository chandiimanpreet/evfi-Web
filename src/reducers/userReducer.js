const initialState = {
    user: null,
    chargers: [],
    phone: '914444444444',
}

const userReducer = (state = initialState, action) => {
    switch (action.type) {
        case 'SET_USER':
            return {
                ...state,
                user: action.payload,
                chargers: action.payload.chargers,
            }
        case 'ADD_USER_DATA':
            return {
                ...state, user: {
                    ...state.user,
                    ...action.payload,
                }
            }
        case 'CLEAR_USER':
            return {
                user: null,
                chargers: [],
                phone: ''
            }
        case 'SET_PHONE':
            return {
                ...state,
                phone: action.payload
            }
        case 'ADD_CHARGER':
            return {
                ...state,
                user: {
                    ...state.user,
                    level3: true,
                }
            }
        case 'UPDATE_PROFILE':
            return {
                ...state,
                user: {
                    ...state,
                    ...action.payload
                } 
                    
            }
        case 'UPDATE_PROFILE_PICTURE':
            return {
                ...state,
                user: {
                    ...state.user,
                    imageUrl: action.payload
                }
            };
        default:
            return state
    }
}
export default userReducer;