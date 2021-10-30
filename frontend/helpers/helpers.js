export async function post(url, body) {
  const res = await fetch(
    `https://bloodcurdling-werewolf-41112.herokuapp.com/${url}`,
    // "http://0.0.0.0:5001/" + url,
    {
      method: "POST",
      body: JSON.stringify(body ? body : {}),
      headers: {
        "Content-type": "application/json; charset=UTF-8",
      },
    }
  );
  return res.json();
}
export async function get(url, query) {
  const res = await fetch(
    `https://bloodcurdling-werewolf-41112.herokuapp.com/${url}?id=${query}`
    // "http://0.0.0.0:5001/" + url + "?id=" + query
  );
  return await res.json();
}
