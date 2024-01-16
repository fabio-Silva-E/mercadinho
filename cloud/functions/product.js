const Product = Parse.Object.extend('Product');
const Category = Parse.Object.extend('Category');
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

       module.exports={formatProduct}