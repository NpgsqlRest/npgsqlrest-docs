import 'example_22_api.dart';

Future<void> main() async {
  baseUrl = 'http://127.0.0.1:8080';

  final search = await example22SearchProducts(
    Example22SearchProductsRequest(search: 'widget', page: 1),
  );
  if (search.ok) {
    for (final product in search.response ?? const []) {
      print('${product.id}: ${product.name} - ${product.price}');
    }
  } else {
    print('Search failed: ${search.status} ${search.error?.title}');
  }

  final product = await productsId(ProductsIdRequest(id: 1));
  print('Product 1: ${product.response?.name}');

  final order = await example22CreateOrder(
    Example22CreateOrderRequest(productId: 1, quantity: 3),
  );
  print('Order result: ${order.response}');
}
