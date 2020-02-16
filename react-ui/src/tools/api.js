import axios from "axios"

export default async function (api, data) {
    const url = `//${window.location.host}/api/v1/${api}`
    
    let response = await axios({
        method: "POST",
        url,
        data: data
    })
    
    return response.data;
}