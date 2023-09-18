function deleteProduct(btn) {
    const csrfToken = btn.parentNode.querySelector('[name=_csrf]').value
    const productId = btn.parentNode.querySelector('[name=productId]').value
    const productElement = btn.closest('article')


    fetch('/admin/product/' + productId, {
        headers: {
            'csrf-token': csrfToken
        },
        method: 'DELETE'
    })
        .then(res => {
            if (res.status === 200) {
                productElement.parentNode.removeChild(productElement)
            }
        })
        .catch(err => console.log(err))
}