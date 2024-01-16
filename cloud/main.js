const Product = Parse.Object.extend('Product');
const Category = Parse.Object.extend('Category');
const CartItem = Parse.Object.extend('CartItem');
const Order = Parse.Object.extend('Order');
const OrderItem = Parse.Object.extend('OrderItem');
Parse.Cloud.define("hello",(request) =>{
    return "Hello world mercadinho"
});
Parse.Cloud.define('get-product-list', async (req)=>{
const queryProducts = new Parse.Query(Product);
//condiçõe da query
if (req.params.title != null){
  queryProducts.fullText('title',req.params.title);
 //  queryProducts.matches('title','.*',+req.params.title+'.*'); //=>filtra trechos da palavra mas tem erros de busca
}
if(req.params.categoryId != null){
  const category =new Category();
  category.id = req.params.categoryId;
  queryProducts.equalTo('category', category) //compara a coluna do ponteiro com o ponteiro criado na função
}//cria  um objeto com o nome do ponteiro usa o objeto.id para receber o id que voce quer buscar
const itemsPerPage = req.params.itemsPerPage || 5;
if (itemsPerPage>100) throw 'quantidade invalida de itens por pagina';
queryProducts.skip(itemsPerPage*req.params.page || 0);
queryProducts.limit(itemsPerPage);
queryProducts.include('category');
  const resultProducts = await queryProducts.find({useMasterKey: true});
  return resultProducts.map(function (p){
    p=p.toJSON();
    return formatProduct(p);
  });
});
 
Parse.Cloud.define('get-category-list', async (req)=>{
const queryCategories = new Parse.Query(Category);
//condições
const resultCategories  = await queryCategories.find({useMasterKey: true});
return resultCategories.map (function(c){
  c = c.toJSON();
  return {
    title: c.title,
    id: c.objectId
  }
});
});
Parse.Cloud.define('signup', async (req) => {
  if(req.params.fullname == null) throw 'INVALIDE_FULLNAME';
   if(req.params.phone== null) throw 'INVALIDE_PHONE';
    if(req.params.cpf == null) throw 'INVALIDE_CPF';
    const user  = new Parse.User();
    user.set('username', req.params.email);
    user.set('email', req.params.email);
    user.set('password', req.params.password);
    user.set('fullname', req.params.fullname);
    user.set('phone', req.params.phone);
    user.set('cpf', req.params.cpf);
  try{
   const resultUser = await user.signUp(null, {useMasterKey: true});
   const userJson = resultUser.toJSON();
   return{
    id: userJson.objectId,
    fullname: userJson.fullname,
    email: userJson.email,
    phone: userJson.phone,
    cpf: userJson.cpf,
    token: userJson.sessionToken,
   }
  }
   catch (e){
throw 'INVALID_DATA'
    
   }
});
Parse.Cloud.define('login', async (req)=>{
  try{
   const user = await Parse.User.logIn(req.params.email, req.params.password);
   const userJson = user.toJSON();
   return formatUser(userJson);
  }catch (e){
    throw 'INVALID_CREDENTIALS';
  }
});
Parse.Cloud.define('validate-token', async (req)=>{
try{
return formatUser(req.user.toJSON());
}catch(e){
  throw 'INVALID_TKEN'
}
});
Parse.Cloud.define('change-password', async (req)=>{
 if(req.user == null) throw 'INVALID_USER';
 const user = await Parse.User.logIn(req.params.email, req.params.currentPassword);
 if(user.id != req.user.id) throw 'INVALID_USER';
 user.set('password', req.params.newPassword);
 await user.save(null,{useMasterKey: true});
});
Parse.Cloud.define('reset-password', async (req) => {
 await Parse.User.requestPasswordReset(req.params.email);
});
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
Parse.Cloud.define('checkout',async(req)=>{
  if(req.user==null) throw 'INVALID_USER'
  const queryCartItems = new Parse.Query(CartItem);
  queryCartItems.equalTo('user',req.user);
  queryCartItems.include('product');
  const resultCartItems = await queryCartItems.find({useMasterKey: true});
 let total=0;
 for(let item of resultCartItems){
  item = item.toJSON();
  total+=item.quantity*item.product.price;
 }
 if(req.params.total!=total)throw 'INVALID_TOTAL';

 const order = new Order();
 order.set('total',total);
 order.set('user',req.user);
 const savedOrder = await order.save(null,{useMasterKey: true});
 for(let item of resultCartItems){
  const orderItem = new OrderItem();
  orderItem.set('order',savedOrder);
  orderItem.set('user',req.user);
  orderItem.set('product',item.get('product'));
  orderItem.set('quantity',item.get('quantity'));
  orderItem.set('price',item.toJSON().product.price);
  await orderItem.save(null,{useMasterKey:true});

 }
 await Parse.Object.destroyAll(resultCartItems,{useMasterKey:true});
 return{
  id: savedOrder.id
 }
});
Parse.Cloud.define('get-orders',async(req)=>{
  if(req.user==null) throw 'INVALID_USER';
  const queryOrders = new Parse.Query(Order);
  queryOrders.equalTo('user',req.user);
  const resultOrders = await queryOrders.find({useMasterKey:true});
  return resultOrders.map(function (o){
    o= o.toJSON();
    return{
      id: o.objectId,
      total: o.total,
      createdAt: o.createdAt
    }
  });
});
Parse.Cloud.define('get-orders-items',async(req)=>{
  if(req.user==null) throw 'INVALID_USER';
  if(req.params.orderId == null)throw 'INVALID_ORDER';
  const order = new Order();
  order.id = req.params.orderId;
  const queryOrderItems = new Parse.Query(OrderItem);
  queryOrderItems.equalTo('order',order);
  queryOrderItems.equalTo('user',req.user);
  queryOrderItems.include('product');
  queryOrderItems.include('product.category');
  const resultOrderItems = await queryOrderItems.find({useMasterKey:true});
  return resultOrderItems.map(function (o){
    o  = o.toJSON();
  return{
    id: o.objectId,
    quantity: o.quantity,
    price: o.price,
    product: formatProduct(o.product)
  }
});
});
function formatUser(userJson){
return{
    id: userJson.objectId,
    fullname: userJson.fullname,
    email: userJson.email,
    phone: userJson.phone,
    cpf: userJson.cpf,
    token: userJson.sessionToken,
   }
  
  
}
function formatProduct(productJson) {
 if (productJson) {
      return {
          id: productJson.objectId,
          title: productJson.title,
          description: productJson.description,
          price: productJson.price,
          unit: productJson.unit,
          picture: productJson.picture != null ? productJson.picture.url : null,
         category: {
             title: productJson.category && productJson.category.title,
             id: productJson.category && productJson.category.objectId
          }
      };
  } else {
      console.error("Objeto 'productJson' é undefined.");
      return null;  // ou algo apropriado para indicar um resultado inválido
  }
}

/* const PDF = Parse.Object.extend("PDF"); // Substitua "PDF" pelo nome da sua classe para armazenar PDFs no Back4App.

Parse.Cloud.define('upload-pdf', async (req) => {
  if (!req.params.pdfData) throw 'INVALID-PDF-DATA';

  const pdfFile = new Parse.File("arquivo.pdf",   req.params.pdfData );

  const pdf = new PDF();
  pdf.set("pdfFile", pdfFile);

  try {
    await pdf.save(null, { useMasterKey: true });
    return "PDF salvo com sucesso!";
  } catch (error) {
    throw `Erro ao salvar o PDF: ${error.message}`;
  }
});
/*const PDF = Parse.Object.extend("PDF"); // Substitua "PDFPath" pelo nome da sua classe para armazenar os caminhos dos PDFs no Back4App.

Parse.Cloud.define('upload-pdf', async (req) => {
  if (!req.params.pdfPath) throw 'INVALID-PDF-PATH';

  const pdfPath = new PDFPath();
  pdfPath.set("path", req.params.pdfPath);

  try {
    await pdfPath.save(null, { useMasterKey: true });
    return "Caminho do PDF salvo com sucesso!";
  } catch (error) {
    throw `Erro ao salvar o caminho do PDF: ${error.message}`;
  }
});*/

