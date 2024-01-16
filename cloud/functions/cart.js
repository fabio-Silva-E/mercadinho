const Product = Parse.Object.extend('Product');
requeri('./product');
const Category = Parse.Object.extend('Category');
Parse.Cloud.define('add-item-to-cart', async (req) => {
    if(req.user==null) throw 'INVALID_USER'
  
   if(req.params.quantity==null)throw 'INVALID-QUANTITY';
   if(req.params.productId==null)throw 'INVALID-PRODUCT';
    const cartItem = new CartItem();
    cartItem.set('quantity',req.params.quantity);  
    const product = new Product();
    product.id = req.params.productId;
    cartItem.set('product',product);
    cartItem.set('user',req.user);
    const savedItem = await cartItem.save(null, {useMasterKey: true});
  
  return{
    id: savedItem.id,
  }});
  Parse.Cloud.define('modify-item-quantity', async (req) => {
    if(req.params.cartItemId==null)throw 'INVALID-CART-ITEM';
    if(req.params.quantity==null)throw 'INVALID-QUANTITY';
    const cartItem = new CartItem();
    cartItem.id = req.params.cartItemId;
    if(req.params.quantity>0){
    cartItem.set('quantity',req.params.quantity);
    await cartItem.save(null, {useMasterKey: true} );
    }else{
      await cartItem.destroy({useMasterKey: true});
    }
  });
  Parse.Cloud.define('get-cart-items', async (req) => {
    if(req.user==null) throw 'INVALID_USER'
  
    const queryCartItems = new Parse.Query(CartItem);
    queryCartItems.equalTo('user',req.user);
  
    queryCartItems.include('product');
    queryCartItems.include('product.category');
    const resultCartItems = await queryCartItems.find({useMasterKey: true});
    return resultCartItems.map(function(c){
      c = c.toJSON();
     return {
        id: c.objectId,
        quantity: c.quantity,
       product: formatProduct(c.product)
          
       
      }
    });
  });