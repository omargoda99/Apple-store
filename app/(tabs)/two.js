import React from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Image, ActivityIndicator, ScrollView, LogBox } from 'react-native';
import { Toast, AlertNotificationRoot, ALERT_TYPE } from 'react-native-alert-notification';
import { FontAwesome, FontAwesome6, Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { AntDesign } from '@expo/vector-icons';
import { FlatList } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { db, FIREBASE_AUTH } from '../FirebaseConfig';
import { collection, addDoc, getDocs, getDoc, setDoc, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { router } from 'expo-router';
const TabTwoScreen = () => {
LogBox.ignoreAllLogs()
  const [lower, setlow] = useState(null);
  const [loading, setLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState('');




  function handleAddToCart(product) {
    const currentUser = FIREBASE_AUTH.currentUser;

    if (currentUser) {
      const { uid } = currentUser;
      let newPrice;
      if (product.offer) {
        newPrice = Number(product.offer);
      } else {
        newPrice = product.price
      }
      const cartItem = { id: product.id, name: product.name, image: product.image, price: newPrice, quantity: 1, Ava: product.quantity };

      const cartRef = doc(db, "carts", uid);
      getDoc(cartRef).then((cartDoc) => {
        if (cartDoc.exists()) {
          const cartData = cartDoc.data();
          const existingItemIndex = cartData.items.findIndex((item) => item.id === cartItem.id);
          if (existingItemIndex > -1) {
            // Item already exists in cart, update its quantity
            const updatedItems = [...cartData.items];

            if (updatedItems[existingItemIndex].quantity < 10 && updatedItems[existingItemIndex].quantity < product.quantity) {
              updatedItems[existingItemIndex].quantity += 1;
              updateDoc(cartRef, { items: updatedItems });
            } else {
              Toast.show({
                type: ALERT_TYPE.WARNING,
                textBody: 'item already has the maximum quantity in cart.',
                autoClose: 2000,
                titleStyle: {
                  fontFamily: "SunshineRegular",
                  color: '#657786',

                },
                textBodyStyle: {
                  fontFamily: "SunshineRegular",
                  color: '#657786',
                },
              });
            }
          } else {
            // Item doesn't exist in cart, add it
            const updatedItems = [...cartData.items, cartItem];
            updateDoc(cartRef, { items: updatedItems });
          }
        } else {
          // Cart doesn't exist, create it
          setDoc(cartRef, { items: [cartItem] });
        }
      }).catch((error) => {
        console.error("Error getting cart document: ", error);
      });

    }
    Toast.show({
      type: ALERT_TYPE.SUCCESS,
      textBody: `${product.name} added to cart.`,
      autoClose: 500,
      titleStyle: {
        fontFamily: "SunshineRegular",
        color: '#657786',

      },
      textBodyStyle: {
        fontFamily: "SunshineRegular",
        color: '#657786',
      },

    })
  }



  const [products, setProducts] = useState([]);

  // create an async function to get the products data from Firestore and update the state
  function getProducts() {
    const productsRef = collection(db, "products"); // create a reference to the "products" collection
    const unsubscribe = onSnapshot(productsRef, (snapshot) => {
      const productsData = []; // create an empty array to hold the products data
      snapshot.forEach((doc) => {
        productsData.push({ id: doc.id, ...doc.data() }); // add each document to the productsData array as an object with the document ID and data
      });
      setProducts(productsData); // update the state with the products data
      setLoading(false);
    }, (error) => {
      console.error("Error getting products from Firestore: ", error); // log any errors
    });

    return unsubscribe;
  }

  // call the getProducts function to get the products data when the component mounts
  useEffect(() => {
    const unsubscribe = getProducts();

    return () => {
      unsubscribe();
    };
  }, []);


  const handleProductPress = (product) => {
    router.push({ pathname: 'Details', params: product });
  }


  const [searchQuery, setSearchQuery] = useState('');


  const handleSearch = () => {
    console.log('Search for:', searchQuery);
  };

  const [sortingMethod, setSortingMethod] = useState(null);


  const renderProductCard = (product) => {
    return (
      <>
        {product.quantity > 0 ? (
          <View key={product.id} style={styles.productCard}>
            <Image style={styles.productImageContainer} source={{ uri: product.image }} >
            </Image>
            {product.offer ? (
              <>
                <Text style={styles.oldPrice}>${product.price}</Text>
                <Text style={styles.productPrice2}>${product.offer}</Text>
              </>
            ) : (
              <Text style={styles.productPrice}>${product.price}</Text>
            )
            }

            <View style={styles.productDetails}>
              <Text style={styles.productName}>{product.name}</Text>
            </View>
            <View style={styles.addToCartButtonContainer}>
              <TouchableOpacity style={styles.iconButton} onPress={() => handleProductPress(product)}>
                <FontAwesome name="info-circle" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.iconButton, styles.addButton]} onPress={() => handleAddToCart(product)}>
                <FontAwesome name="cart-plus" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View >
        ) : (
          <View key={product.id} style={styles.productCard}>
            <Image style={styles.productImageContainer} source={{ uri: product.image ? product.image : product.images[0] }} ></Image>

            {product.offer ? (
              <>
                <Text style={styles.oldPrice}>${product.price}</Text>
                <Text style={[styles.productPrice2]}>${product.offer}</Text>
              </>
            ) : (
              <Text style={styles.productPrice}>${product.price}</Text>
            )
            }

            <View style={styles.productDetails}>
              <Text style={styles.productName}>{product.name}</Text>
            </View>
            <View style={{
              flexDirection: 'column',
              alignItems: 'center',
              padding: 10
            }}>
              <Text style={styles.test}>Out of stock!</Text>

            </View>
          </View >
        )
        }
      </>
    )

  };
  const [selectedPrice, setSelectedPrice] = useState(null);
  const [filteredPriceRange, setFilteredPriceRange] = useState([0, Infinity]);

  const handlePriceChange = (itemValue) => {
    setSelectedPrice(itemValue);
    setCustomLowerBound('');
    setCustomUpperBound('');
    switch (itemValue) {
      case null:
        setFilteredPriceRange([0, Infinity]);
        break;
      case 499:
        setFilteredPriceRange([0, 499]);
        setlow(0)

        break;
      case 999:
        setFilteredPriceRange([500, 999]);
        setlow(555)

        break;
      case 1000:
        setFilteredPriceRange([1000, Infinity]);
        break;
      case 'custom':
        // do nothing, custom range will be set with text input
        break;
      default:

    }
  };
  const [customLowerBound, setCustomLowerBound] = useState('');
  const [customUpperBound, setCustomUpperBound] = useState('');


  const filteredProducts = searchQuery
    ? products.filter(
      (product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        (product.offer > 1 ? product.offer >= filteredPriceRange[0] && product.offer <= filteredPriceRange[1] :
          product.price >= filteredPriceRange[0] && product.price <= filteredPriceRange[1]) &&
        (!selectedCategory || selectedCategory === '' || product.cat === selectedCategory)
    )
    : products.filter(
      (product) =>
        (product.offer > 1 ? product.offer >= filteredPriceRange[0] && product.offer <= filteredPriceRange[1] :
          product.price >= filteredPriceRange[0] && product.price <= filteredPriceRange[1]) &&
        (!selectedCategory || selectedCategory === '' || product.cat === selectedCategory)
    );

  if (sortingMethod === 'lowToHigh') {
    filteredProducts.sort((a, b) => a.price - b.price);
  } else if (sortingMethod === 'highToLow') {
    filteredProducts.sort((a, b) => b.price - a.price);
  }

  console.log(selectedCategory)
  return (
    <ScrollView style={styles.container}>
      <View  style={{ flexDirection: 'row', alignSelf: 'center', paddingTop: 20, }}>
        <TouchableOpacity onPress={() => setSelectedCategory('')} style={{ backgroundColor: selectedCategory == '' ? '#E1E8ED': 'white', padding: 6, elevation: 2, borderRadius: 10, margin: 5}}><Text style={{ fontFamily: 'SunshineRegular', color: "#657786" }}>All products</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => setSelectedCategory('iphones')} style={{backgroundColor: selectedCategory == 'iphones' ? '#E1E8ED': 'white', padding: 6, elevation: 2, borderRadius: 10, margin: 5 }}><Text style={{ fontFamily: 'SunshineRegular', color: "#657786" }}>iphones</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => setSelectedCategory('watches')} style={{backgroundColor: selectedCategory == 'watches' ? '#E1E8ED': 'white', padding: 6, elevation: 2, borderRadius: 10, margin: 5 }}><Text style={{ fontFamily: 'SunshineRegular', color: "#657786" }}>whatches</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => setSelectedCategory('macbooks')} style={{ backgroundColor: selectedCategory == 'macbooks' ? '#E1E8ED': 'white', padding: 6, elevation: 2, borderRadius: 10, margin: 5 }}><Text style={{ fontFamily: 'SunshineRegular', color: "#657786" }}>Macbooks</Text></TouchableOpacity>
      </View>
      <View style={{ alignSelf: 'center', paddingTop: 20 }}>
        <View style={styles.searchBarContainer}>
          <TextInput
            style={styles.searchBar}
            placeholder="Search Products"
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              setSelectedPrice(null);
              setCustomLowerBound("");
              setCustomUpperBound("");
              setFilteredPriceRange([0, Infinity]);
              setSortingMethod(null);
            }}
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Ionicons name="search" size={24} color="#1DA1F2" />
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: 'row', marginBottom: 20 }}>
          <View style={{ flexDirection: 'column' }}>

            <Text style={styles.priceFilterLabel}>
              Filter by:{' '}
              <Text style={{ fontFamily: 'SunshineRegular' }}>
                {typeof selectedPrice === 'number'
                  ? selectedPrice === 1000 ? '+' : `${lower} : `
                  : ''}
                {selectedPrice}
              </Text>
            </Text>

            <View style={styles.priceFilterContainer}>


              <Picker
                selectedValue={selectedPrice}
                onValueChange={handlePriceChange}
                style={styles.priceFilterPicker}
                androidStyle={{ fontFamily: 'SunshineRegular' }}
              >
                <Picker.Item
                  label="All"
                  value={null}
                  color="#657786"
                  style={styles.priceFilterPickerLabel}
                />
                <Picker.Item
                  label="$0 - $499"
                  value={499}
                  color="#657786"
                  style={styles.priceFilterPickerLabel}
                />
                <Picker.Item
                  label="$500 - $999"
                  value={999}
                  color="#657786"
                  style={styles.priceFilterPickerLabel}
                />
                <Picker.Item
                  label="$1000+"
                  value={1000}
                  color="#657786"
                  style={styles.priceFilterPickerLabel}
                />
                <Picker.Item
                  label="Custom Range"
                  value="custom"
                  color="#657786"
                  style={styles.priceFilterPickerLabel}
                />
              </Picker>

            </View>
          </View>
          <View style={{ flexDirection: 'column' }}>
            <Text style={styles.sortingMethodLabel}>Sort by: <Text style={{
              fontFamily: 'SunshineRegular',
              fontSize: 14,
            }}>{sortingMethod != null && sortingMethod === 'lowToHigh' ? 'low : high' : sortingMethod === 'highToLow' ? 'high : low' : ''}</Text></Text>


            <View style={styles.sortingMethodContainer}>
              <Picker
                selectedValue={sortingMethod}
                onValueChange={setSortingMethod}
                style={styles.sortingMethodPicker}
                androidStyle={{ fontFamily: 'SunshineRegular' }}
              >
                <Picker.Item style={styles.sunshineRegular} label="None" value={null} color="#657786" />
                <Picker.Item style={styles.sunshineRegular} label="Low to High" value="lowToHigh" color="#657786" />
                <Picker.Item style={styles.sunshineRegular} label="High to Low" value="highToLow" color="#657786" />
              </Picker>
            </View>
          </View>
        </View>
        {selectedPrice === 'custom' && (
          <View style={styles.customPriceRangeContainer}>
            <TextInput
              style={styles.customPriceRangeInput}
              placeholder="Min"
              value={customLowerBound}
              keyboardType="numeric"
              onChangeText={(text) => setCustomLowerBound(text)}
            />
            <Text style={styles.customPriceRangeDash}>:   </Text>
            <TextInput
              style={styles.customPriceRangeInput}
              placeholder="Max"
              value={customUpperBound}
              keyboardType="numeric"
              onChangeText={(text) => setCustomUpperBound(text)}
            />
            <TouchableOpacity
              style={styles.customPriceRangeButton}
              onPress={() =>
                setFilteredPriceRange([
                  Number(customLowerBound) || 0,
                  Number(customUpperBound) || Infinity,
                ])
              }
            >
              <Text style={styles.customPriceRangeButtonText}>Go</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setSelectedPrice(null);
                setCustomLowerBound("");
                setCustomUpperBound("");
                setFilteredPriceRange([0, Infinity]);
              }}
              style={{ paddingLeft: 10 }}
            >
              <Feather name="x" size={24} color="#657786" />
            </TouchableOpacity>
          </View>)}
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#1DA1F2" style={{ marginTop: '50%' }} />
      ) : (
        <>
          {filteredProducts.length > 0 ? (
            <FlatList
              data={filteredProducts}
              renderItem={({ item }) => renderProductCard(item)}
              contentContainerStyle={styles.productListContainer}
              numColumns={2}

            />
          ) : (
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsText}>No products found.</Text>
            </View>
          )}
        </>
      )}
    </ScrollView>

  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8FA',
  },
  customPriceRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15
  },
  priceFilterPickerLabel: {
    fontFamily: "SunshineRegular",
    textAlign: "center",
    color: '#657786',
    fontSize: 12,

  },
  customPriceRangeInput: {
    flex: 1,
    height: 40,
    fontFamily: 'SunshineRegular',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 10,
    marginRight: 15,
  },
  customPriceRangeDash: {
    fontSize: 20,
    fontFamily: 'SunshineRegular',
    color: '#657786',
  },
  customPriceRangeButton: {
    backgroundColor: '#1DA1F2',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  customPriceRangeButtonText: {
    fontSize: 16,
    fontFamily: 'SunshineRegular',
    color: '#FFFFFF',
  },

  sortingMethodLabel: {
    fontSize: 16,
    fontFamily: 'SunshineRegular',
    color: '#657786',
    marginLeft: 10,
    paddingBottom: 5,
  },

  test: {
    fontFamily: 'SunshineRegular',
    alignSelf: 'center',
    fontSize: 16,
    color: '#657786',
  },
  productPrice2: {
    fontSize: 15,
    color: '#657786',
    position: 'absolute',
    margin: 5,
    padding: 5,
    backgroundColor: '#E1E8ED',
    borderRadius: 10,
    fontFamily: 'SunshineRegular',

  },
  oldPrice: {
    fontSize: 18,
    color: '#657786',
    position: 'absolute',
    right: 0,
    padding: 5,
    textDecorationLine: 'line-through', // add this line to cross out the text
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    fontFamily: 'SunshineRegular',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    height: 40,
    padding: 10,
    marginBottom: 20,
  },
  searchBar: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'SunshineRegular',
    color: '#657786',
  },
  searchButton: {
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  productListContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
    gap: 10,
    paddingHorizontal: 40,
    paddingBottom: 50
  },

  priceFilterLabel: {
    fontSize: 16,
    fontFamily: 'SunshineRegular',
    color: '#657786',
    paddingBottom: 5
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    justifyContent: 'space-between',
  },
  priceFilterContainer: {
    flex: 1,
    height: 40,
    width: 130,
    fontFamily: 'SunshineRegular',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 10,
    marginRight: 10,
  },
  priceFilterPicker: {
    fontFamily: 'SunshineRegular',
    color: '#657786',

  },
  sunshineRegular: {
    fontFamily: 'SunshineRegular',
    color: '#657786',
    fontSize: 12,
    width: 'auto',
    alignContent: 'flex-start',
  },
  sortingMethodContainer: {
    flex: 1,
    height: 40,
    fontFamily: 'SunshineRegular',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 10,
    marginLeft: 10,
    width: 130,

  },
  sortingMethodPicker: {
    color: '#657786',
    fontStyle: 'italic',
  },

  productCard: {
    backgroundColor: '#E1E8ED',
    borderRadius: 10,
    marginBottom: 20,
    margin: 10,
    width: 140,
    height: 290,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 5, height: 0.1 },
    shadowOpacity: 2, // Increase the opacity to make the shadow more visible
    shadowRadius: 3, // Increase the radius to make the shadow larger
    elevation: 3, // Adjust the elevation to fine-tune the shadow
    alignSelf: 'center'
  },
  productImageContainer: {
    height: 190,
    backgroundColor: '#E1E8ED',
    alignItems: 'center',
    justifyContent: 'center',

  },

  productDetails: {
    paddingTop: 10,
    alignItems: 'center'
  },
  productName: {
    fontSize: 18,
    fontFamily: 'SunshineRegular',
    color: '#657786',
  },
  productPrice: {
    fontSize: 15,
    color: '#657786',
    position: 'absolute',
    padding: 5,
    fontFamily: 'SunshineRegular',
    margin: 5,

    backgroundColor: '#E1E8ED',

    borderRadius: 10
  },
  addToCartButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'absolute', // set a fixed position
    bottom: 10, // set the distance from the bottom of the card
    left: 10,
    right: 10,
  },
  iconButton: {
    backgroundColor: '#657786',
    borderRadius: 10,
    padding: 10,
    marginLeft: 8,
    width:45,
    alignItems:'center'
  },
  addButton: {
    marginRight: 8
  }
  ,
  addToCartButtonText: {
    fontSize: 17,
    fontFamily: 'SunshineRegular',
    color: '#FFFFFF',
    textAlign: 'center',
  },

  noResultsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noResultsText: {
    fontSize: 16,
    fontFamily: 'SunshineRegular',
    color: '#657786',
  },
}

);
export default TabTwoScreen;