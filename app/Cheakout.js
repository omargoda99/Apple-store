import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator } from 'react-native';
import { StripeProvider, CardField } from '@stripe/stripe-react-native';
import { collection, getDoc, doc, updateDoc, addDoc, serverTimestamp, deleteDoc, query, where, getDocs, runTransaction } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { db, FIREBASE_AUTH } from './FirebaseConfig';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ALERT_TYPE, Dialog, AlertNotificationRoot, Toast } from 'react-native-alert-notification';

const CheckoutPage = () => {
  const [userData, setUserData] = useState(null);
  const [cardNumber, setCardNumber] = useState(null);
  const [paid, setpaid] = useState(false)
  const [wow, setwow] = useState(true)
  const [loading, setLoading] = useState(false)
  const [paymentMethod, setpay] = useState('')
  const [address, setAddres] = useState(null)
  const [phoneNUMBER, setPhone] = useState(null)
  const [confirmed, setConfirm] = useState(false)
  const [payDisabled, setPayDisabled] = useState(false);
  const getUserData = async () => {
    const userDocRef = doc(db, "users", FIREBASE_AUTH.currentUser.email);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      setUserData(docSnap.data());
      setAddres(docSnap.data().Address)
      setPhone(docSnap.data().Phone)
    }
  }

  const navigation = useNavigation();
  const [discountCode, setDiscountCode] = useState('');
  const [Show, setShow] = useState(false);
  const handlePayWithBalance = async () => {
    if (confirmed === false) {
      Toast.show({
        type: ALERT_TYPE.WARNING,
        textBody: 'Please confirm your information first!',
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
      return;
    }

    if (userData && userData.balance >= total) {
      try {
        setLoading(true)
        const currentUser = FIREBASE_AUTH.currentUser;

        if (currentUser) {
          const { uid } = currentUser;
          const ordersCollectionRef = collection(db, "orders");
          const orderData = {
            userId: uid,
            items: [...cartItems],
            subtotal,
            shipping,
            total,
            timestamp: new Date().toISOString(),
            id: "",
            done: 'no',
            isReady: "no",
            username: userData.name,
            email: userData.email,
            Address: address,
            Phone: phoneNUMBER,
            paymentMethod: 'Paid with balance',
          };
          if (discountApplied === true) {
            orderData.discountCode = codename;
            orderData.amount = amount
          }

          const docRef = await addDoc(ordersCollectionRef, orderData);
          await updateDoc(docRef, { id: docRef.id });

          const userDocRef = doc(db, 'users', FIREBASE_AUTH.currentUser.email);
          await runTransaction(db, async (transaction) => {
            const userDocSnapshot = await transaction.get(userDocRef);
            const userData = userDocSnapshot.data();
            const newBalance = userData.balance - total;
            if (newBalance < 0) {
              throw new Error('Insufficient balance');
            }
            transaction.update(userDocRef, { balance: newBalance });
          });

          const updatedUserDocSnapshot = await getDoc(userDocRef);
          const updatedUserData = updatedUserDocSnapshot.data();
          const newBalance = updatedUserData.balance;
          router.push('(tabs)');
          setLoading(false)
          alert(`Order placed successfully. Your new balance is $${newBalance.toFixed(2)}.`);

          cartItems.forEach(async (item) => {
            const product = products.find(p => p.id === item.id);
            if (product) {
              const productRef = doc(db, "products", product.id);
              const newQuantity = product.quantity - item.quantity;
              await updateDoc(productRef, { quantity: newQuantity });
              console.log(`Updated quantityAvailable for product ${product.id} to ${newQuantity}`);
            } else {
              console.log(`Product with ID ${item.id} not found in products array`);
            }
          });

          const cartRef = doc(db, "carts", uid);
          updateDoc(cartRef, { items: [] })
            .then(() => {
              setCartItems([]);
            })
            .catch((error) => {
              console.error("Error removing all items from cart: ", error);
            });
        }
      } catch (error) {
        console.error("Error handling payment: ", error);
        Toast.show({
          type: ALERT_TYPE.ERROR,
          textBody: error.message,
          autoClose: 3000,
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
      Toast.show({
        type: ALERT_TYPE.WARNING,
        textBody: 'You do not have enough balance to pay for this order.',
        autoClose: 3000,
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
  };
  const [discountApplied, setDiscountApplied] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const removeDiscount = () => {
    setDiscountApplied(false);
    setDiscountCode('');
    Toast.show({
      type: ALERT_TYPE.SUCCESS,
      textBody: 'Discount removed!',
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
    setTotal(calculatedTotal);
  };

  useEffect(() => {
    const currentUser = FIREBASE_AUTH.currentUser;

    if (currentUser) {
      const { uid } = currentUser;
      const cartRef = doc(db, "carts", uid);

      getDoc(cartRef)
        .then((cartDoc) => {
          if (cartDoc.exists()) {
            const cartData = cartDoc.data();
            setCartItems(cartData.items);
          }
        })
        .catch((error) => {
          console.error("Error getting cart document: ", error);
        });
    }
  }, []);


  const [products, setProducts] = useState([]);

  // create an async function to get the products data from Firestore and update the state
  async function getProducts() {
    try {

      const productsRef = collection(db, "products"); // create a reference to the "products" collection
      const productsSnapshot = await getDocs(productsRef); // get a snapshot of the "products" collection
      const productsData = []; // create an empty array to hold the products data
      productsSnapshot.forEach((doc) => {
        productsData.push({ id: doc.id, ...doc.data() }); // add each document to the productsData array as an object with the document ID and data
      });
      setProducts(productsData); // update the state with the products data
    } catch (error) {
      console.error("Error getting products from Firestore: ", error); // log any errors
    }
  }
  useEffect(() => {
    if (confirmed) {
      Toast.show({
        type: ALERT_TYPE.SUCCESS,
        textBody: 'information confirmed!',
        autoClose: 2000,
        titleStyle: {
          fontFamily: 'SunshineRegular',
          color: '#657786',
        },
        textBodyStyle: {
          fontFamily: 'SunshineRegular',
          color: '#657786',
        },
      });
    }
  }, [confirmed]);
  useEffect(() => {
    getProducts();
    getUserData();

  }, []);
  const handlepay = async () => {

    if (confirmed === false) {
      Toast.show({
        type: ALERT_TYPE.WARNING,
        textBody: 'Please confirm your information first!.',
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
      return;
    }

    setShow(false)
    setpaid(true)
    setpay('on delevery')
  }

  const handlepay2 = async () => {

    if (confirmed === false) {
      Toast.show({
        type: ALERT_TYPE.WARNING,
        textBody: 'Please confirm your information first!.',
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
      return;
    }
    setwow(false)
    setShow(true)

  }

  const handelConfirm = async () => {
    // check if address and phone number are not "none"
    if (address === "none" || address === '') {
      Toast.show({
        type: ALERT_TYPE.WARNING,
        textBody: 'Please enter your address.',
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
      return;
    }
    if (phoneNUMBER === "none" || phoneNUMBER === '') {
      Toast.show({
        type: ALERT_TYPE.WARNING,
        textBody: 'Please enter your phone number.',
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
      return;
    }
    setConfirm(true)

  }


  const handlePlaceOrder = async () => {
    try {
      if (confirmed === false) {
        Toast.show({
          type: ALERT_TYPE.WARNING,
          textBody: 'Please confirm your information.',
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
        return;
      }
      // check if address and phone number are not "none"
      if (address === "none" || address === '') {
        Toast.show({
          type: ALERT_TYPE.WARNING,
          textBody: 'Please enter your address.',
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
        return;
      }
      if (paymentMethod === '') {
        Toast.show({
          type: ALERT_TYPE.WARNING,
          textBody: 'Please choose a payment method.',
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
        return;
      }
      if (phoneNUMBER === "none" || phoneNUMBER === '') {
        Toast.show({
          type: ALERT_TYPE.WARNING,
          textBody: 'Please enter your phone number.',
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
        return;
      }
      setLoading(true)
      const currentUser = FIREBASE_AUTH.currentUser;

      if (currentUser) {
        const { uid } = currentUser;
        const ordersCollectionRef = collection(db, "orders");
        const orderData = {
          userId: uid,
          items: [...cartItems],
          subtotal,
          shipping,
          total,
          timestamp: new Date().toISOString(),
          id: "", // Initialize orderId property
          done: 'no',
          isReady: "no",
          username: userData.name,
          email: userData.email,
          Address: address,
          Phone: phoneNUMBER,
          paymentMethod
        };
        if (discountApplied === true) {
          orderData.discountCode = discountCode;
          orderData.amount = amount;
          orderData.old = subtotal2;


        }


        const docRef = await addDoc(ordersCollectionRef, orderData);
        await updateDoc(docRef, { id: docRef.id }); // Set orderId property with the document ID
        console.log("Order stored with ID: ", docRef.id);
        setLoading(false)
        router.push('(tabs)')
        alert('Order placed successfully');

        // Loop through cartItems and update quantityAvailable for each product
        cartItems.forEach(async (item) => {
          const product = products.find(p => p.id === item.id);
          if (product) {
            const productRef = doc(db, "products", product.id);
            const newQuantity = product.quantity - item.quantity;
            await updateDoc(productRef, { quantity: newQuantity });
            console.log(`Updated quantityAvailable for product ${product.id} to ${newQuantity}`);
          } else {
            console.log(`Product with ID ${item.id} not found in products array`);
          }
        });
        // Clear the cart

        const cartRef = doc(db, "carts", uid);

        updateDoc(cartRef, { items: [] })
          .then(() => {
            setCartItems([]);
          })
          .catch((error) => {
            console.error("Error removing all items from cart: ", error);
          });
      }
    } catch (error) {
      console.error("Error handling payment: ", error);
    }
  };

  const [amount, setAmount] = useState(null);
  const [test, setTest] = useState(null);


  const applyDiscount = async () => {
    if (discountCode === '') {
      Toast.show({
        type: ALERT_TYPE.WARNING,
        textBody: 'Please enter a discount code first.',
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
      return;
    }

    if (discountApplied === true) {
      Toast.show({
        type: ALERT_TYPE.WARNING,
        textBody: 'Discount has already been applied.',
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
      return;
    }

    if (discountCode) {
      const discountCodesRef = collection(db, 'discountCodes');
      const discountCodeQuery = query(
        discountCodesRef,
        where('code', '==', discountCode),
      );

      try {
        const querySnapshot = await getDocs(discountCodeQuery);
        if (!querySnapshot.empty) {
          const discountData = querySnapshot.docs[0].data();
          const discountAmount = subtotal * (discountData.amount);
          const discountedTotal = subtotal - discountAmount + shipping;
          setTotal(discountedTotal);
          setDiscountApplied(true);
          setCode(discountCode);
          setAmount(discountData.amount);
          Toast.show({
            type: ALERT_TYPE.SUCCESS,
            textBody: 'Discount applied successfully!',
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
        } else {
          setDiscountCode('');
          Toast.show({
            type: ALERT_TYPE.WARNING,
            textBody: 'Invalid discount code',
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
      } catch (error) {
        console.error('Error applying discount:', error);
      }
    }

  };
  console.log(amount)
  let subtotal = cartItems.reduce((acc, item) => {
    // Check if item quantity is greater than 1
    if (item.quantity > 1) {
      acc += (item.price * item.quantity) - (item.price * item.quantity * 0.1);
    } else {
      acc += item.price * item.quantity;
    }
    return acc;
  }, 0);
  let subtotal2 = cartItems.reduce((acc, item) => {
    // Check if item quantity is greater than 1
    if (item.quantity > 1) {
      acc += (item.price * item.quantity) - (item.price * item.quantity * 0.1);
    } else {
      acc += item.price * item.quantity;
    }
    return acc;
  }, 0);
  router
  const shipping = 20;
  const calculatedTotal = discountApplied ? subtotal - (subtotal * amount) + shipping : subtotal + shipping;
  const [total, setTotal] = useState(0);
  const [codename, setCode] = useState('');
  discountApplied ? subtotal = subtotal - (subtotal * amount) : null;
  useEffect(() => {
    setCode(discountCode);
    setTotal(calculatedTotal);
  }, [calculatedTotal]);

  const itemElements = cartItems.map((item) => {
    let discount = 0;
    let lol = 0
    if (item.quantity > 1) {
      discount = item.price * 0.1;
      lol = item.price - discount
    }
    return (
      <View style={styles.item} key={item.id}>
        {item.quantity >= 2 &&
          <Text style={styles.note}>10% discount</Text>}
        <View style={{ ...styles.test, flex: 1, alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={[styles.itemPrice, { position: 'absolute', left: '50%' }]}>quantity: {item.quantity}</Text>
        </View>
        <Text style={{ ...styles.itemQuantity, alignSelf: 'flex-end', textAlign: 'right' }}>
          {discount > 0 ? (
            <Text style={styles.itemPrice2}>${lol.toFixed(2)}</Text>
          ) :
            <Text style={styles.itemPrice2}>${item.price.toFixed(2)}</Text>
          }</Text>

      </View>

    );
  });

  return (
    <AlertNotificationRoot>
      <ScrollView style={{ backgroundColor: '#F5F8FA' }}>
        <View style={styles.container}>

          <Text style={styles.title}>order receipt</Text>
          <View style={styles.itemsContainer}>{itemElements}</View>
          <View style={{ paddingRight: 25, paddingLeft: 25, paddingBottom: 0, borderColor: '#657786', borderBottomWidth: 1 }}>

            <View style={styles.subtotalContainer}>
              <Text style={styles.subtotalText}>Subtotal:</Text>
              <Text style={styles.subtotal}>${subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.shippingContainer}>
              <Text style={styles.shippingText}>Shipping:</Text>
              <Text style={styles.shipping}>${shipping.toFixed(2)}</Text>
            </View>
            <View style={styles.totalContainer}>
              <Text style={styles.totalText}>Total:</Text>
              <Text style={styles.total}>${total.toFixed(2)}</Text>
            </View>
            {discountApplied == true ? (
              <View>
                <Text style={[styles.totalText, { fontSize: 15, alignSelf: 'center' }]}>code '<Text style={{ fontFamily: 'SunshineRegular' }}>{codename}</Text>' applied with <Text style={{ fontFamily: 'SunshineRegular' }}>{amount * 100}% </Text>
                  discount</Text>
                <Text style={[styles.totalText, { fontSize: 15, alignSelf: 'center' }]}>
                  subtotal changed from
                  <Text style={{ fontFamily: 'SunshineRegular' }}> ${subtotal2} </Text>
                  to
                  <Text style={{ fontFamily: 'SunshineRegular' }}> ${subtotal.toFixed(2)}</Text></Text>
                <TouchableOpacity style={[styles.totalText, { fontSize: 15, marginBottom: 15, alignSelf: 'center' }]} onPress={removeDiscount}>
                  <Text style={{
                    fontFamily: 'SunshineRegular',
                    color: '#1DA1F2',

                  }}>Remove Discount</Text>
                </TouchableOpacity>
              </View>
            ) : (null)}
          </View>
          {confirmed ? (
            <View style={{ backgroundColor: 'white', borderRadius: 10, padding: 10, margin: 13, borderBottomColor: '#657786', borderBottomWidth: 1 }}>
              <Text style={[styles.itemName, { alignSelf: 'center' }]}>your information</Text>

              <View style={{
                paddingRight: 15, paddingLeft: 15, paddingTop: 10,

              }}>
                <Text style={{
                  fontFamily: 'SunshineRegular',
                  color: '#657786',
                }}><Text style={{ fontFamily: 'SunshineRegular' }}>Address:</Text> {address}</Text>
                <Text style={{
                  fontFamily: 'SunshineRegular',
                  color: '#657786',
                }}><Text style={{ fontFamily: 'SunshineRegular' }}>Phone Number:</Text> {phoneNUMBER}</Text>
              </View>
              <TouchableOpacity onPress={() => { setConfirm(false), setShow(false), setwow(true) }}>
                <Text style={{
                  alignSelf: 'center', paddingTop: 10,
                  fontFamily: 'SunshineRegular',
                  color: '#657786',
                }}>change  <Feather name='edit'></Feather>
                </Text>
              </TouchableOpacity>
            </View>
          ) :
            (
              <View style={{ paddingRight: 35, paddingLeft: 35, paddingBottom: 20, paddingTop: 10, borderBottomColor: '#657786', borderBottomWidth: 1 }}>
                <Text style={[styles.itemName, { alignSelf: 'center' }]}>confirm your information</Text>
                <Text style={{
                  fontFamily: 'SunshineRegular',
                  color: '#657786',
                  paddingTop: 10
                }}>your Address</Text>
                <TextInput
                  style={styles.discountCodeInput}
                  placeholder="Enter your Address"
                  value={address === 'none' ? "" : address}
                  onChangeText={setAddres}
                  numberOfLines={4}
                  multiline={true}
                  textAlignVertical="top"
                  returnKeyType="done"
                  blurOnSubmit={true}
                />
                <Text style={{
                  fontFamily: 'SunshineRegular',
                  color: '#657786',
                  paddingTop: 10
                }}>your phone number</Text>
                <TextInput
                  style={styles.discountCodeInput}
                  placeholder="Enter Phone number"
                  value={phoneNUMBER === 'none' ? "" : phoneNUMBER}
                  onChangeText={setPhone}
                  keyboardType="numeric"
                />
                <TouchableOpacity style={styles.paymentButton3} onPress={handelConfirm}>
                  <Text style={styles.applyDiscountButtonText}>confirm</Text>
                </TouchableOpacity>
              </View>
            )
          }
          <View style={{ paddingRight: 22, paddingLeft: 22, flexDirection: 'row', justifyContent: 'center' }}>

            <TextInput
              style={[styles.discountCodeInput, { margin: 5 }]}
              placeholder="Enter discount code"
              value={discountCode}
              onChangeText={setDiscountCode}
            />
            <TouchableOpacity style={[styles.paymentButton2, { margin: 5 }]} onPress={applyDiscount}>
              <Text style={styles.paymentButtonText}>Apply Discount</Text>
            </TouchableOpacity>
          </View>

          {loading ? (<ActivityIndicator size="large" color="#1DA1F2" style={{ marginTop: '10%' }} />) : (<>
            {wow ? (
              <>
                {paid ? (<View style={{
                  backgroundColor: '#E1E8ED',
                  borderRadius: 10,
                  padding: 10,
                  margin: 10,
                  paddingBottom: 15,
                  flexDirection: 'row',
                }}>
                  <Text
                    style={{
                      fontFamily: 'SunshineRegular',
                      color: '#657786',

                    }}
                  > payment Method :<Text style={{ fontFamily: 'SunshineRegular' }}> {paymentMethod}</Text>
                  </Text>

                  <Text
                    style={{
                      fontFamily: 'SunshineRegular',
                      color: '#1DA1F2',
                      position: 'absolute',
                      right: 15,
                      alignSelf: 'center',
                      justifyContent: 'center'
                    }} onPress={() => setpaid(false)}> change <Feather name='edit'></Feather> </Text>

                </View>
                ) : (
                  <>
                    {confirmed &&
                      <View style={{
                        backgroundColor: '#E1E8ED',
                        borderRadius: 10,
                        padding: 10,
                        margin: 10,
                        paddingBottom: 15
                      }}>
                        <Text style={styles.title2}>Choose Payment Method</Text>
                        <View style={{
                          flexDirection: 'row',
                          justifyContent: 'center',
                          alignSelf: 'center',
                        }}>
                          <TouchableOpacity style={{
                            ...styles.paymentButton7,
                            flex: 1,
                          }} onPress={handlepay2}>
                            <Text style={styles.paymentButtonText}> Pay {'\n'} by {'\n'} card </Text>

                          </TouchableOpacity>
                          <TouchableOpacity style={{
                            ...styles.paymentButton7,
                            flex: 1,
                          }} onPress={handlepay}>
                            <Text style={styles.paymentButtonText}> Pay {'\n'} on {'\n'} Delivery</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={{
                            ...styles.paymentButton7,
                            flex: 1,
                          }} onPress={handlePayWithBalance}>
                            <Text style={styles.paymentButtonText}> Pay {'\n'} by {'\n'} Balance </Text>
                          </TouchableOpacity>
                        </View>
                        <Text style={{
                          alignSelf: 'center', fontFamily: 'SunshineRegular', padding: 10,
                          color: '#657786',
                        }}>current Balance is <Text style={{

                          color: '#1DA1F2',

                        }}>${userData ? userData.balance.toFixed(2) : '0.00'}</Text></Text>
                      </View>
                    }
                  </>
                )
                }
              </>

            ) :
              (null)}

            {Show ? (<View style={{
              backgroundColor: '#E1E8ED',
              borderRadius: 10,
              padding: 10,
              margin: 10,
              paddingBottom: 15
            }}>


              <StripeProvider>
                <CardField
                  postalCodeEnabled
                  style={{ height: 50 }}
                  onCardChange={(cardDetails) => {
                    setCardNumber(cardDetails.number);
                  }}
                />
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    paddingRight: 20,
                    paddingLeft: 20,
                    paddingTop: 10,
                  }}
                >
                  <TouchableOpacity
                    style={[styles.paymentButton2, { margin: 5 }]}
                    onPress={() => {
                      setShow(false);
                      setwow(true);
                    }}
                  >
                    <Text style={styles.paymentButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.paymentButton2,
                      { opacity: payDisabled ? 0.5 : 1 },
                    ]}
                    onPress={() => {
                      if (cardNumber === null) {
                        Toast.show({
                          type: ALERT_TYPE.WARNING,
                          textBody: 'Please enter card details first .',
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
                        return;
                      }
                      setpay("Paid by card");
                      setShow(false);
                      setwow(true);
                      setpaid(true);
                    }}
                    disabled={payDisabled}
                  >
                    <Text style={styles.paymentButtonText}>Pay now</Text>
                  </TouchableOpacity>
                </View>
              </StripeProvider>
            </View>
            ) : (null)
            }
            {paid && confirmed ? (
              <View style={{ padding: 20 }}>
                {/* <Text style={styles.paymentText}>Payment Method: </Text> */}
                <TouchableOpacity style={styles.paymentButton4} onPress={handlePlaceOrder}>
                  <Text style={styles.paymentButtonText}>Place Order</Text>
                </TouchableOpacity>
              </View>
            ) : (null)}
          </>)}
        </View>
      </ScrollView>
    </AlertNotificationRoot >
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingRight: 20,
    paddingLeft: 20,
    paddingBottom: 60,
    backgroundColor: '#F5F8FA',
  },
  note: {
    position: 'absolute',
    fontFamily: "SunshineRegular",
    fontSize: 12,
    color: "#fff",
    right: '0%',
    borderTopRightRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 1,
    borderBottomLeftRadius: 10,
    backgroundColor: '#657786',
    zIndex: 1 // Set the z-index to 1
  },
  scrollView: {
    flexGrow: 1,
  },
  discountCodeInput: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    marginTop: 10,
    fontFamily: 'SunshineRegular',

  },
  discountCodeInput2: {
    backgroundColor: 'white',
    borderRadius: 10,

    fontFamily: 'SunshineRegular',

  },
  applyDiscountButton: {
    backgroundColor: '#1DA1F2',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignSelf: 'center',
    marginBottom: 10,
  },
  applyDiscountButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    textAlign: 'center',
    fontFamily: 'SunshineRegular',
  },
  title: {
    fontFamily: 'SunshineRegular',
    fontSize: 25,
    marginBottom: 10,
    color: '#1DA1F2',
    textAlign: 'center',
  },
  title2: {
    fontFamily: 'SunshineRegular',
    color: '#657786',
    fontSize: 16,
    marginBottom: 10,

    textAlign: 'center',
  },
  itemsContainer: {

  },
  item: {
    padding: 10,
    marginBottom: 10,
    height: 50,
    backgroundColor: '#E1E8ED',
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  test: {
    backgroundColor: '#E1E8ED',
    flexDirection: 'row',
    width: '70%'
  },
  itemName: {
    fontSize: 18,
    fontFamily: 'SunshineRegular',
    color: '#657786',
  },
  itemQuantity: {
    fontSize: 18,
    fontFamily: 'SunshineRegular',
    color: '#657786',
  },
  itemPrice: {
    fontSize: 18,
    fontFamily: 'SunshineRegular',
    color: '#657786',
    marginRight: 30,
    marginTop: 5
  },
  itemPrice2: {
    fontSize: 16,
    fontFamily: 'SunshineRegular',
    color: '#657786',
  },
  subtotalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  subtotalText: {
    fontSize: 18,
    fontFamily: 'SunshineRegular',
    color: '#657786',
  },
  subtotal: {
    fontSize: 18,
    fontFamily: 'SunshineRegular',
    color: '#1DA1F2',
  },
  shippingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  shippingText: {
    fontSize: 18,
    fontFamily: 'SunshineRegular',
    color: '#657786',
  },
  shipping: {
    fontSize: 18,
    fontFamily: 'SunshineRegular',
    color: '#1DA1F2',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  totalText: {
    fontSize: 20,
    fontFamily: 'SunshineRegular',
    color: '#657786',
  },
  total: {
    fontSize: 20,
    fontFamily: 'SunshineRegular',
    color: '#1DA1F2',

  },
  paymentText: {
    marginTop: 15,
    alignSelf: 'center',
    fontSize: 20,
    fontFamily: 'SunshineRegular',
    color: '#657786',
    marginBottom: 15,
  },
  paymentButton: {
    backgroundColor: '#1DA1F2',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignSelf: 'center',
    marginBottom: 15,
  },
  paymentButton6: {
    backgroundColor: '#657786',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignSelf: 'center',
    width: '100%',
  },
  paymentButton7: {
    backgroundColor: '#657786',
    borderRadius: 10,
    marginTop: 10,
    width: '100%',
    height: '90%',
    paddingVertical: 10,
    alignSelf: 'center',
    marginRight: 2,
    marginLeft: 2,
  },
  paymentButton2: {
    backgroundColor: '#657786',
    borderRadius: 10,
    alignSelf: 'center',
    padding: 10,
  },
  paymentButton3: {
    backgroundColor: '#657786',
    borderRadius: 10,
    width: '100%', padding: 10,

    alignSelf: 'center',
  },
  paymentButton4: {
    backgroundColor: '#1DA1F2',

    borderRadius: 10,
    width: '100%', padding: 10,
    alignSelf: 'center',
  },
  paymentButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    padding: 2,
    justifyContent: 'center',
    textAlign: 'center',
    fontFamily: 'SunshineRegular',
  },

});

export default CheckoutPage;

